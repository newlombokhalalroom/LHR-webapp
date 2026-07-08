<script setup>
import { useOrderStore } from "@/store/order";
import { useUserStore } from "@/store/user";
import { useClientStore } from "@/store/client";
import { storeToRefs } from "pinia";

import {
  NSkeleton,
  NAlert,
  NCard,
  NDivider,
  NCheckbox,
  NSpace,
  NButton,
  NCollapseTransition,
  NTag,
  NPagination,
  NRate,
  NInput,
  NModal,
  useNotification,
  useLoadingBar,
  useMessage,
} from "naive-ui";
import moment from "moment/min/moment-with-locales";
import { required, email, minLength, helpers } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
// moment.locale("id");

const $orderStore = useOrderStore();
const $userStore = useUserStore();
const $clientStore = useClientStore();
const { data: $dataUser } = storeToRefs($userStore);

const $message = useMessage();
const $breakpoint = useBreakpoint();
const {
  $roles,
  $amongIncludes,
  $addSeparator,
  $dateAddition,
  $dateEdit,
  $dateHours,
  $dateSubstract,
  $window,
} = useNuxtApp();
const url = useRequestURL();
const $loadingBar = useLoadingBar();
const { $useDbStorage } = useStorage();
const $notification = useNotification();
const router = useRouter();
const { $api } = useApi();
const { $createError } = useErrorHandler();
const $props = defineProps({
  target: {
    type: Object,
    default: null,
  },
});

const $searchType = {
  Wishlist: "Wishlist",
  Payment: "orders.status='unpaid'",
  Process: "orders.status='process'",
  Complete: "orders.status='progress'",
  Succeed: "orders.status='done'",
  Cancelled: "orders.status='cancelled'",
  History: "1=1",
};

const $title = ref("Booking");
const $description = ref("Manage your booking plan more here");
const $image = ref("https://www.lombokhalalroom.com/favicon.ico");

useSeoMeta({
  title: () => $title.value,
  description: () => $description.value,
  ogTitle: () => $title.value,
  ogDescription: () => $description.value,
  ogImage: () => $image.value,
  ogImageAlt: () => $title.value,
  ogImageSecureUrl: () => $image.value,
  ogImageUrl: () => $image.value,
  ogUrl: () => url.origin,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: () => $title.value,
  twitterDescription: () => $description.value,
  twitterImage: () => $image.value,
  twitterImageAlt: () => $title.value,
  robots: "index, follow",
});

const $local = reactive({
  mainLoading: false,
  openClientSection: null,
  openOrderItemsSection: null,
  openConfirmation: null,
  selectedBooking: null,
  selectedMessage: null,
  selectedSearch: $searchType.Wishlist,
  startDate: null,
  data: null,
  raw: null,
  term: null,
  page: 1,
  showReviewModal: false,
  reviewTarget: null,
  reviewRate: 5,
  reviewContent: '',
  reviewLoading: false,
  countdowns: {},
});

const $model = reactive({
  firstName: null,
  lastName: null,
  phone: null,
  email: null,
});

const $form = useVuelidate(
  {
    email: {
      required,
      email: helpers.withMessage(
        ({ $pending, $invalid, $params, $model: _model }) => `${_model} not an email`,
        email
      ),
    },
    phone: {
      required,
      minLength: helpers.withMessage(() => `Have at least 6 digit`, minLength(6)),
    },
    firstName: {
      required,
      minLength: helpers.withMessage(() => `Have at least 3 characters`, minLength(3)),
    },
    lastName: {
      required,
      minLength: helpers.withMessage(() => `Have at least 3 characters`, minLength(3)),
    },
  },
  $model
);

const $startDate = computed({
  get() {
    return new Date($local.startDate || new Date()).getTime();
  },
  set(_value) {
    $local.startDate = new Date(_value);
  },
});

const $onPaymentSubmit = async (_payload) => {
  $local.mainLoading = true;
  try {
    const _resp = await $api.get(`/orders/${_payload?.id}/payment`);
    if (_resp?.status && _resp?.result?.token && window?.snap?.pay) {
      window.snap.pay(_resp?.result?.token, {
        onSuccess: async function (result) {
          $notification.success({
            title: "Payment Status",
            content: "Payment successful! Updating order status...",
          });

          // Manually update status for sandbox (webhook can't reach localhost)
          try {
            await $api.put(`/orders/${_payload?.id}/sandbox-confirm`);
          } catch (e) {
            console.log('Manual notification fallback:', e);
          }

          $local.mainLoading = true;
          setTimeout(async () => {
            $local.selectedSearch = $searchType.Process;
            $local.page = 1;
            await $onFetchMain();
            $local.mainLoading = false;
          }, 2000);
        },
        onPending: function (result) {
          $notification.warning({
            title: "Payment Status",
            content: "Waiting for your payment",
          });
        },
        onError: function (result) {
          $notification.error({
            title: "Payment Status",
            content: "Payment failed!",
          });
        },
        onClose: function () {
          $notification.info({
            title: "Payment Status",
            content: "You closed the popup without completing the payment",
          });
        },
      });
    }
  } catch (error) {
    console.log(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onSubmitBooking = async (_payload) => {
  try {
    const orderItem = _payload?.order;
    let orderItems = [];
    if (orderItem?.isTour) {
      // For tours, send 1 item with quantity = pax count
      const item = {
        productId: orderItem?.id,
        quantity: orderItem?.amount || 1,
      };
      if (orderItem?.schedule_id) item.schedule_id = orderItem.schedule_id;
      if (orderItem?.hotel_id) item.hotel_id = orderItem.hotel_id;
      if (orderItem?.pickup_location) item.pickup_location = orderItem.pickup_location;

      orderItems = [item];
    } else {
      // For others (Hotels), keep N items with quantity 1
      orderItems = Array.from(Array(orderItem?.amount || 1).keys())?.map((_item) => {
        const item = {
          productId: orderItem?.id,
          quantity: 1,
        };
        if (orderItem?.schedule_id) item.schedule_id = orderItem.schedule_id;
        if (orderItem?.hotel_id) item.hotel_id = orderItem.hotel_id;
        if (orderItem?.pickup_location) item.pickup_location = orderItem.pickup_location;
        return item;
      });
    }
    
    let orderBody = {
      startDate: $dateHours(orderItem?.startDate, 12),
      endDate: $dateHours(orderItem?.endDate, 12),
      orderItems: orderItems.map(item => {
        const filteredItem = {};
        for (const [key, value] of Object.entries(item)) {
            if (value !== null && value !== undefined) {
                filteredItem[key] = value;
            }
        }
        return filteredItem;
      }),
    };

    const _resp = await $api.post(`/orders/${orderItem?.client?.id}`, orderBody);

    if (_resp?.status) {
      $local.data = $local.data
        ?.map((_item) => ({
          ..._item,
          orderItems: _item?.orderItems?.filter(
            (__item) => !orderBody?.orderItems?.find((_check) => _check.productId == __item?.id)
          ),
        }))
        ?.filter((_item) => !_item?.orderItems?.length <= 0);

      // _item?.client?.id !== _payload?.order?.client?.id
      await $useDbStorage("booking", $local.data?.length <= 0 ? null : $local.data);
    }
    return _resp?.message;
  } catch (error) {
    throw error;
  }
};

const $onSubmitContacts = async (_payload) => {
  $local.mainLoading = true;
  try {
    if (!(await $form.value.$validate())) {
      throw new Error("Please fill all blank field on the form!");
    }

    const contactBody = {
      firstName: $model.firstName,
      lastName: $model.lastName,
      email: $model.email,
      phone: $model.phone
        ?.replaceAll("+", "")
        ?.replaceAll("-", "")
        .replaceAll(String.fromCharCode(160), ""),
    };

    const _resp = await $api.put("/contacts", contactBody);
    if (_resp?.status && confirm("Are you sure to continue?")) {
      const _respOrder = await $onSubmitBooking(_payload);
      if (typeof _respOrder == "string") {
        $notification.success({
          title: "Success",
          content: "Your booking were made successfully",
        });
      }
    }

    $form.value?.$reset();
    Object.keys($model).forEach((_target) => {
      $model[_target] = null;
    });
    $local.openConfirmation = null;
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onFetchMain = async (_payload) => {
  $local.mainLoading = true;
  try {
    if ($local.selectedSearch !== $searchType.Wishlist) {
      $local.page = _payload?.page || 1;
      const _limit = _payload?.limit || 5;
      const _page = $local.page;

      const _getOrders = await $api.get("/orders", {
        params: {
          filter: JSON.stringify({
            where: $local.selectedSearch.toLowerCase(),
            order: "_created_date DESC",
          }),
          page: _page,
          limit: _limit,
        },
      });
      $local.data = _getOrders?.result;
      $local.raw = _getOrders;

      return;
    }
    $local.data = await $useDbStorage("booking");
  } catch (error) {
    $local.data = null;
    $local.raw = null;
  } finally {
    console.log($local.raw);
    $local.mainLoading = false;
  }
};

const $onUpdate = async (_body = null, _path = null, notice = false) => {
  $local.mainLoading = true;
  try {
    await $orderStore.put(_path, _body);
    // todo:force update
    await $onFetchMain({ page: 1 });
    if (notice) {
      $notification.success({
        title: "Status",
        content: "Data successfully updated",
      });
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onConfirm = async (_payload) => {
  $local.mainLoading = true;
  try {
    if (confirm("Are you sure to confirm? this cannot be undone once confirmed.")) {
      await $onUpdate(null, `${_payload.id}/completed`);
      $local.selectedSearch = $searchType.Done;
      $notification.success({
        title: "Status",
        content: "Bookings successfully booked",
      });
    } else {
      throw new Error("Your booking remain pending for the confirmation");
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onSubmitReview = async () => {
  if (!$local.reviewTarget) return;
  $local.reviewLoading = true;
  try {
    const orderId = $local.reviewTarget.orderId;
    const productId = $local.reviewTarget.productId;
    await $api.post(`/orders/${orderId}/reviews/${productId}`, {
      reviewContent: $local.reviewContent,
      reviewRate: $local.reviewRate,
    });
    $notification.success({
      title: 'Success',
      content: 'Review submitted successfully. Thank you!',
    });
    $local.showReviewModal = false;
    $local.reviewTarget = null;
    $local.reviewContent = '';
    $local.reviewRate = 5;
  } catch (error) {
    $createError(error);
  } finally {
    $local.reviewLoading = false;
  }
};

const $statusColor = (status) => {
  const map = {
    unpaid: 'error',
    process: 'warning',
    progress: 'info',
    done: 'success',
    cancelled: 'default',
  };
  return map[status] || 'default';
};

const $statusLabel = (status) => {
  const map = {
    unpaid: 'Unpaid',
    process: 'Waiting for Confirmation',
    progress: 'On Progress',
    done: 'Completed',
    cancelled: 'Cancelled',
  };
  return map[status] || status;
};

const PAYMENT_DEADLINE_MS = 60 * 60 * 1000; // 1 hour
let countdownInterval = null;

const $getCountdownText = (orderId) => {
  return $local.countdowns[orderId] || '';
};

const $startCountdowns = () => {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(async () => {
    if ($local.selectedSearch !== $searchType.Payment) return;
    if (!$local.data?.length) return;

    const now = Date.now();
    let needsRefresh = false;

    $local.data.forEach((_item) => {
      if (_item.status !== 'unpaid') return;
      const created = new Date(_item._created_date).getTime();
      const deadline = created + PAYMENT_DEADLINE_MS;
      const remaining = deadline - now;

      if (remaining <= 0) {
        $local.countdowns[_item.id] = 'Time expired';
        // Jangan panggil fetch ulang secara membabi buta agar tidak infinite loop
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        $local.countdowns[_item.id] = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    });
  }, 1000);
};

const $onCancelOrder = async (orderId) => {
  if (!confirm('Are you sure you want to cancel this order?')) return;
  $local.mainLoading = true;
  try {
    await $api.put(`/orders/${orderId}/cancel`);
    $notification.success({
      title: 'Success',
      content: 'Order has been cancelled.',
    });
    $local.selectedSearch = $searchType.Cancelled;
    $local.page = 1;
    await $onFetchMain();
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

watch(
  () => $local.selectedSearch,
  async (_val) => {
    $local.page = 1;
    await $onFetchMain();
    if (_val === $searchType.Payment) {
      $startCountdowns();
    } else if (countdownInterval) {
      clearInterval(countdownInterval);
    }
  }
);

watch(
  () => $local.mainLoading,
  (_val) => {
    if (_val) $loadingBar.start();
    else setTimeout(() => $loadingBar.finish(), 500);
  }
);

watch(
  () => $dataUser.value?.id,
  (_val) => {
    if (!$dataUser.value?.id) {
      $local.selectedSearch = $searchType.Wishlist;
    }
  }
);

onMounted(async () => {
  $local.mainLoading = true;
  try {
    $local.data = await $useDbStorage("booking");
    // b822acae-dd55-4305-a892-534a01cc0165/products
    // if ($local.data?.length > 0) {
    //   $local.data = await Promise.all(
    //     $local.data?.map(async (_item) => {
    //       const _resp = await $clientStore.get(`${_item?.client?.id}/products`, {
    //         query: {
    //           startDate: new Date(),
    //         },
    //       });

    //       console.log(_resp);

    //       if (_resp?.status && _resp?.result?.items?.length < _item?.amount) {
    //         _item.unavailable = _item?.amount - _resp?.result?.items?.length;
    //       }
    //       return _item;
    //     })
    //   );
    // }

    window.scrollTo({ top: 0 });
  } finally {
    $local.mainLoading = false;
  }
});

onUnmounted(() => {
  $local.selectedBooking = null;
  $local.selectedMessage = null;
  $loadingBar.finish();
  if (countdownInterval) clearInterval(countdownInterval);
});
</script>
<template>
  <molecules-drawer
    v-model:show="$local.openConfirmation"
    :content="{
      title: 'Proceed Your Booking',
    }"
    @mounted="
      () => {
        const _fn = async () => {
          try {
            const _resp = await $api.get('/contacts');
            if (_resp?.status) {
              Object.keys($model).forEach((_target) => {
                $model[_target] = _resp?.result?.contact?.[_target];
              });
            }
            $local.openConfirmation = {
              ...$local.openConfirmation,
              startDate: new Date($local.openConfirmation.startDate).getTime(),
              endDate: new Date($local.openConfirmation.endDate).getTime(),
            };
            // console.log($local.openConfirmation);
            return {
              contact: Object.assign({}, _resp?.result?.contact),
              order: Object.assign({}, $local.openConfirmation),
            };
          } catch (error) {
            return null;
          } finally {
            $local.mainLoading = false;
          }
        };

        return _fn;
      }
    "
  >
    <template v-slot="{ data }">
      <!-- {{ $local.openConfirmation.orderItems }} -->
      <div>
        <n-alert type="info"><atoms-text>Please fill the form</atoms-text></n-alert>
        <br />
        <n-divider title-placement="left" class="!mt-0">
          <div class="flex gap-5">
            <atoms-text>Detail Booking</atoms-text>
            <n-button
              size="small"
              type="error"
              @click="
                () => {
                  data.order = Object.assign(
                    {},
                    {
                      ...($local.openConfirmation || {}),
                      orderItems: Array.apply(
                        [],
                        $local.openConfirmation.orderItems?.map((_item) => Object.assign({}, _item))
                      ),
                    }
                  );
                }
              "
              >Reset</n-button
            >
          </div>
        </n-divider>
        <atoms-input
          label="Your Firstname"
          :disabled="$isLoading"
          @vue:mounted="
            () => {
              $model.firstName = data?.contact?.firstName;
            }
          "
          v-model:value="$model.firstName"
          :isError="$form.firstName.$error"
          :errors="$form.firstName.$errors"
          required
        />
        <atoms-input
          label="Your Lastname"
          :disabled="$isLoading"
          v-model:value="$model.lastName"
          :isError="$form.lastName.$error"
          :errors="$form.lastName.$errors"
          required
        />
        <atoms-input
          label="Phone Number"
          v-maska
          data-maska="+62-###-####-#####"
          :disabled="$isLoading"
          v-model:value="$model.phone"
          :isError="$form.phone.$error"
          :errors="$form.phone.$errors"
          required
        />
        <atoms-input
          label="Your Email"
          type="email"
          :disabled="$isLoading"
          v-model:value="$model.email"
          :isError="$form.email.$error"
          :errors="$form.email.$errors"
          placeholder="Type your email"
          required
        />
        <section v-if="data?.order" class="space-y-2">
          <n-card size="small">
            <section class="grid grid-cols-12 gap-5 overflow-hidden">
              <atoms-image-native
                class="cursor-pointer col-span-full md:col-span-2 bg-slate-100"
                :height="$breakpoint.mdAndDown ? '100px' : 'auto'"
                :src="data?.order?.pictures?.[0]?.picture"
                :alt="data?.order?.pictures?.[0]?.description"
              >
                <template #none
                  ><atoms-icon flat :size="25" name="file" class="!text-primary"
                /></template>
              </atoms-image-native>
              <div class="space-y-5 col-span-full md:col-span-10">
                <div class="space-y-2">
                  <atoms-text span strong>{{ data?.order?.title }}</atoms-text>
                  <atoms-text caption v-html="data?.order?.description"></atoms-text>
                  <n-divider class="!my-2"></n-divider>
                  <div class="flex justify-between">
                    <atoms-text caption strong class="!text-primary">Room</atoms-text>
                    <atoms-text caption
                      >IDR {{ $addSeparator(data?.order?.price || 0) }}/{{
                        data?.order?.units || "rent"
                      }}</atoms-text
                    >
                  </div>
                  <div class="flex justify-between nowrap">
                    <atoms-text caption strong class="!text-primary">Amount</atoms-text>
                    <atoms-text caption>{{ data?.order?.amount }}x</atoms-text>
                  </div>
                  <div class="flex justify-between">
                    <atoms-text caption strong class="!text-primary">Total</atoms-text>
                    <atoms-text caption
                      >IDR
                      {{
                        $addSeparator((data?.order?.price || 0) * (data?.order?.amount || 0))
                      }}</atoms-text
                    >
                  </div>
                  <div class="flex justify-between">
                    <atoms-text caption strong class="!text-primary capitalize"
                      >Check-in</atoms-text
                    >
                    <div v-if="data?.order?.client?.title?.toLowerCase()?.includes('tour')" class="w-1/2 text-right">
                      <atoms-text span>{{ moment(data?.order?.startDate).format("DD MMMM YYYY") }}</atoms-text>
                    </div>
                    <div v-else class="w-1/2">
                      <atoms-input-date
                        :is-date-disabled="
                          (ts) => ts < new Date($dateHours(new Date(), 12)).getTime()
                        "
                        v-model:value="data.order.startDate"
                        hide-detail
                        type="date"
                        format="dd MMMM yyyy"
                      />
                    </div>
                  </div>

                  <div class="flex justify-between mt-2">
                    <atoms-text caption strong class="!text-primary capitalize"
                      >Check-out (Before)</atoms-text
                    >
                    <div v-if="data?.order?.client?.title?.toLowerCase()?.includes('tour')" class="w-1/2 text-right">
                      <atoms-text span>{{ moment(data?.order?.endDate).format("DD MMMM YYYY") }}</atoms-text>
                    </div>
                    <div v-else class="w-1/2">
                      <atoms-input-date
                        :is-date-disabled="
                          (ts) => ts < new Date($dateHours(data?.order?.startDate, 12)).getTime()
                        "
                        v-model:value="data.order.endDate"
                        type="date"
                        hide-detail
                        @change="
                          () => {
                            if (
                              data?.order?.startDate &&
                              data?.order?.endDate &&
                              data?.order?.amount
                            ) {
                              const dateIn = moment(
                                new Date($dateHours(data?.order?.startDate, 12))
                              );
                              const dateOut = moment(
                                new Date($dateHours(data?.order?.endDate, 12))
                              );
                              const diff = dateOut.diff(dateIn, 'days');
                              if (diff > 0) {
                                data.order.amount = diff || 1;
                              }
                            }
                          }
                        "
                        format="dd MMMM yyyy"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </n-card>
          <br />
        </section>
        <section class="grid md:grid-cols-5">
          <div class="space-y-1">
            <atoms-text caption strong class="!text-primary capitalize">Booking amount</atoms-text>
            <atoms-text span> {{ data?.order?.amount }}x</atoms-text>
          </div>
          <div class="space-y-1" v-if="data?.order?.hotel_id && data?.order?.hotelPrice">
            <atoms-text caption strong class="!text-primary capitalize">Hotel ({{ data?.order?.hotelName }})</atoms-text>
            <atoms-text span>IDR {{ $addSeparator(data?.order?.hotelPrice || 0) }}</atoms-text>
          </div>
          <div class="space-y-1">
            <atoms-text caption strong class="!text-primary capitalize">Total</atoms-text>
            <atoms-text span
              >IDR
              {{
                $addSeparator(
                  (data?.order?.price || 0) * (data?.order?.amount || 0) +
                  (data?.order?.hotelPrice || 0)
                )
              }}</atoms-text
            >
          </div>
        </section>
        <br />
        <!-- <n-divider /> -->
        <!-- <atoms-input-date
          label="Check-in"
          :is-date-disabled="(ts) => ts <= $dateEdit(new Date(), -1)"
          v-model:value="$startDate"
          type="date"
          format="dd MMMM yyyy"
          class="w-full"
        />
        <div class="space-y-1">
          <atoms-text caption strong class="!text-primary capitalize"
            >Check-out (Before)</atoms-text
          >
          <atoms-text span>{{
            moment($dateHours(new Date($dateEdit($startDate, 1)), 12)).format(
              "DD MMMM YYYY - H:mm A"
            )
          }}</atoms-text>
        </div>
        <br /> -->
        <n-button
          type="primary"
          class="w-full"
          @click="
            () => {
              if (
                data?.order?.orderItems?.find((_item) => {
                  const dateIn = moment(new Date($dateHours(_item.startDate, 12)));
                  const dateOut = moment(new Date($dateHours(_item.endDate, 12)));
                  let diff = dateOut.diff(dateIn, 'days');

                  if (
                    new Date(dateIn) < $dateHours(new Date(), 12) ||
                    new Date(dateOut) < new Date(dateIn)
                  ) {
                    diff = 0;
                  }

                  return diff <= 0;
                })
              ) {
                $createError(
                  new $window.Error(
                    'Please check orders check-in/out, these must be valid range within 1 day'
                  )
                );
              } else {
                $onSubmitContacts({
                  ...(data?.contact || {}),
                  order: data?.order || {},
                });
              }
            }
          "
          >Continue</n-button
        >
      </div>
    </template>
  </molecules-drawer>

  <br />
  <atoms-container class="space-y-5">
    <atoms-heading h2>Booking</atoms-heading>

    <n-alert type="info">
      <atoms-text span>Checkbox only for selected items to be proceed</atoms-text>
    </n-alert>

    <n-space v-if="$dataUser?.id">
      <n-button
        v-for="([_searchKey, _searchValue], _iitem) in Object.entries($searchType)"
        :key="_iitem"
        :type="$local.selectedSearch == _searchValue ? 'primary' : undefined"
        @click="$local.selectedSearch = _searchValue"
        >{{ _searchKey?.replaceAll("_", " ") }}</n-button
      >
    </n-space>
    <n-space v-else>
      <n-button
        :type="$local.selectedSearch == $searchType.Wishlist ? 'primary' : undefined"
        @click="$local.selectedSearch = $searchType.Wishlist"
        >{{ $searchType.Wishlist }}</n-button
      >
    </n-space>

    <section v-if="$local.mainLoading" class="flex flex-wrap items-center justify-between gap-5">
      <n-skeleton height="100px" :repeat="4" />
    </section>
    <section v-else-if="$local.data?.length > 0" class="space-y-2">
      <n-card v-for="(_item, _iitem) in $local.data" :key="_iitem">
        <template #header>
          <atoms-heading
            v-if="$local.selectedSearch == $searchType.Wishlist"
            h4
            class="capitalize"
            >{{ _item.client?.name }}</atoms-heading
          >
          <atoms-heading v-else h4 class="!uppercase"
            >ORD{{
              String(_item.id)?.slice(0, 3) +
              moment(_item.start_date).format("DDMMYY") +
              +moment(_item._created_date).format("HHmmss")
            }}</atoms-heading
          >
        </template>
        <template #header-extra>
          <atoms-icon
            v-if="$local.selectedSearch == $searchType.Wishlist"
            name="delete"
            @click="
              () => {
                if ($window.confirm(`Are you sure to delete booking from (${_item.client.name})`)) {
                  $local.data = $local.data = $local.data?.filter(
                    (_target) => _target?.client?.id !== _item?.client?.id
                  );
                  $useDbStorage('booking', $local.data);
                }
              }
            "
          ></atoms-icon>
        </template>
        <div v-if="$local.selectedSearch == $searchType.Process">
          <n-alert type="info">
            <atoms-text caption
              >Please wait for {{ _item.client?.title || "hotel" }} to confirm your
              bookings</atoms-text
            >
          </n-alert>
          <br />
        </div>
        <!-- <div v-if="$local.selectedSearch == $searchType.Complete">
          <n-alert type="info">
            <atoms-text caption
              >Please confirm your bookings to continue and get able to check-in</atoms-text
            >
          </n-alert>
          <br />
        </div> -->
        <n-divider title-placement="left" class="!mt-0">
          <n-space>
            <n-button
              size="tiny"
              @click="
                () => {
                  if ($local.openClientSection?.includes(_item.client?.id)) {
                    $local.openClientSection = $local.openClientSection?.filter(
                      (__item) => __item !== _item.client?.id
                    );
                  } else {
                    $local.openClientSection = [
                      ...new Set([...($local.openClientSection || []), _item.client?.id]),
                    ];
                  }
                }
              "
              >Show Client Description</n-button
            >
            <n-button
              v-if="$local.selectedSearch != $searchType.Wishlist"
              size="tiny"
              @click="
                () => {
                  if ($local.openOrderItemsSection?.includes(_item?.id)) {
                    $local.openOrderItemsSection = $local.openOrderItemsSection?.filter(
                      (__item) => __item !== _item?.id
                    );
                  } else {
                    $local.openOrderItemsSection = [
                      ...new Set([...($local.openOrderItemsSection || []), _item?.id]),
                    ];
                  }
                }
              "
              >Show Booking Items</n-button
            >
          </n-space>
        </n-divider>

        <n-collapse-transition
          :show="$local.openClientSection?.includes(_item.client?.id) || false"
        >
          <section class="grid-cols-2 gap-2 mb-5 md:grid">
            <div class="space-y-1">
              <atoms-text caption strong class="!text-primary capitalize"
                >{{ _item.client?.title }}
              </atoms-text>
              <atoms-text class="capitalize">{{ _item.client?.name || "-" }}</atoms-text>
            </div>
            <div class="space-y-1">
              <atoms-text caption strong class="!text-primary capitalize">Email </atoms-text>
              <atoms-text>{{ _item.client?.email || "-" }}</atoms-text>
            </div>
            <div class="space-y-1">
              <atoms-text caption strong class="!text-primary capitalize">Customer Call</atoms-text>
              <atoms-text class="capitalize">{{ _item.client?.phone || "-" }}</atoms-text>
            </div>
            <div class="space-y-1">
              <atoms-text caption strong class="!text-primary capitalize">Certified </atoms-text>
              <n-space gap="2">
                <n-tag>Halal</n-tag>
                <n-tag>Verified Partner</n-tag>
              </n-space>
            </div>
            <div class="space-y-1 col-span-full">
              <atoms-text caption strong class="!text-primary capitalize">Description</atoms-text>
              <atoms-text class="capitalize" v-html="_item.client?.description || '-'"></atoms-text>
            </div>
          </section>
        </n-collapse-transition>

        <section v-if="$local.selectedSearch != $searchType.Wishlist && $dataUser?.id">
          <n-collapse-transition :show="$local.openOrderItemsSection?.includes(_item?.id) || false">
            <section class="space-y-2">
              <n-card
                size="small"
                v-for="(__item, __iitem) in _item.items?.map((_orderItem) => ({
                  ...(_orderItem?.product || _orderItem || {}),
                  quantity: +_orderItem?.quantity || 0,
                  total: +_orderItem?.total || 0,
                }))"
                :key="__iitem"
              >
                <section class="overflow-hidden">
                  <div>
                    <atoms-text span strong>{{ __item.title }}</atoms-text>
                    <atoms-text caption v-html="__item.description"></atoms-text>
                    <n-divider class="!my-2"></n-divider>
                    <!-- <div class="flex justify-between">
                      <atoms-text caption strong class="!text-primary">Room</atoms-text>
                      <atoms-text caption
                        >IDR {{ $addSeparator(__item.price || 0) }}/{{
                          __item.units || "rent"
                        }}</atoms-text
                      >
                    </div> -->
                    <div class="flex justify-between">
                      <atoms-text caption strong class="!text-primary">Amount</atoms-text>
                      <atoms-text span>{{ __item.amount || 1 }}x</atoms-text>
                    </div>
                    <div class="flex justify-between">
                      <atoms-text caption strong class="!text-primary">Price</atoms-text>
                      <atoms-text span
                        >IDR {{ $addSeparator(__item.total || 0) }}/{{
                          __item.units || "rent"
                        }}</atoms-text
                      >
                    </div>
                  </div>
                </section>
              </n-card>
              <br />
            </section>
          </n-collapse-transition>
          <section class="grid md:grid-cols-3">
            <div>
              <atoms-text caption strong class="!text-primary capitalize">Check-in</atoms-text>
              <atoms-text>{{ moment(_item.start_date).format("DD MMMM YYYY") }}</atoms-text>
            </div>
            <div>
              <atoms-text caption strong class="!text-primary capitalize">Check-out</atoms-text>
              <atoms-text>{{ moment(_item.end_date).format("DD MMMM YYYY") }}</atoms-text>
            </div>
            <div>
              <atoms-text caption strong class="!text-primary capitalize">Created At</atoms-text>
              <atoms-text>{{
                moment(_item._created_date).format("DD MMMM YYYY, HH:mm:ss")
              }}</atoms-text>
            </div>
            <!-- <div>
              <atoms-text caption strong class="!text-primary capitalize">Status</atoms-text>
              <atoms-text class="capitalize">{{ _item.status }}</atoms-text>
            </div> -->
            <div>
              <atoms-text caption strong class="!text-primary capitalize">Total</atoms-text>
              <atoms-text>IDR {{ $addSeparator(Number(_item.total || 0)) }}</atoms-text>
            </div>
          </section>
          <br />

          <!-- Deadline waktu pembayaran -->
          <n-space v-if="_item.status == 'unpaid'" align="center" class="flex-wrap">
            <n-tag type="error" size="small" v-if="$getCountdownText(_item.id)">
              ⏱️ {{ $getCountdownText(_item.id) }}
            </n-tag>
            <n-button
              type="primary"
              size="small"
              :disabled="$getCountdownText(_item.id) === 'Time expired'"
              @click="
                () => {
                  if (!$dataUser?.id) {
                    $notification.warning({
                      title: 'Attention',
                      content: 'Please login to continue',
                    });
                    return;
                  }
                  $onPaymentSubmit(_item);
                }
              "
              >Pay Now</n-button
            >
            <n-button
              type="error"
              size="small"
              @click="$onCancelOrder(_item.id)"
              >Cancel</n-button
            >
          </n-space>
          <n-space v-else-if="_item.status === 'process'" align="center">
            <n-tag :type="$statusColor(_item.status)" size="small">{{ $statusLabel(_item.status) }}</n-tag>
            <n-button
              size="small"
              @click="router.push(`/booking/invoice/${_item.id}`)"
              >View Invoice</n-button
            >
          </n-space>
          <n-space v-else-if="_item.status === 'progress'" align="center">
            <n-tag :type="$statusColor(_item.status)" size="small">{{ $statusLabel(_item.status) }}</n-tag>
            <n-button
              size="small"
              @click="router.push(`/booking/invoice/${_item.id}`)"
              >Lihat Invoice</n-button
            >
            <n-button
              type="primary"
              size="small"
              :disabled="new Date() < new Date(_item.end_date)"
              @click="$onConfirm(_item)"
              >Confirm Completed</n-button
            >
          </n-space>
          <n-space v-else-if="_item.status === 'done'" align="center">
            <n-tag :type="$statusColor(_item.status)" size="small">{{ $statusLabel(_item.status) }}</n-tag>
            <n-button
              size="small"
              @click="router.push(`/booking/invoice/${_item.id}`)"
              >Lihat Invoice</n-button
            >
            <n-button
              type="success"
              size="small"
              @click="
                () => {
                  $local.reviewTarget = {
                    orderId: _item.id,
                    productId: _item.items?.[0]?.product?.id || _item.items?.[0]?.product_id,
                    productTitle: _item.items?.[0]?.product?.title || _item.items?.[0]?.title,
                  };
                  $local.showReviewModal = true;
                }
              "
              >Write Review</n-button
            >
          </n-space>
          <n-space v-else-if="_item.status === 'cancelled'" align="center">
            <n-tag :type="$statusColor(_item.status)" size="small">{{ $statusLabel(_item.status) }}</n-tag>
          </n-space>
        </section>

        <!-- todo: whislist -->
        <section v-else>
          <section class="space-y-2">
            <n-card size="small" v-for="(__item, __iitem) in _item.orderItems" :key="__iitem">
              <template #header>
                <n-button
                  type="primary"
                  class="w-full md:w-auto"
                  @click="
                    () => {
                      if (!$dataUser?.id) {
                        $notification.warning({
                          title: 'Attention',
                          content: 'Please login to continue',
                        });
                        return;
                      }
                      $local.openConfirmation = __item;
                    }
                  "
                  >Proceed</n-button
                >
              </template>
              <template #header-extra>
                <client-only>
                  <atoms-icon
                    flat
                    name="close"
                    @click="
                      () => {
                        if ($window.confirm(`Are you sure to delete this item (${__item.title})`)) {
                          $local.data = $local.data?.map((_target) => ({
                            ..._target,
                            orderItems:
                              _target.client?.id == _item.client?.id
                                ? _target?.orderItems?.filter(
                                    (_targetItem) => _targetItem.id !== __item.id
                                  )
                                : _target?.orderItems,
                          }));

                          const _isNotExists = $local.data?.find(
                            (_target) => _target?.orderItems?.length <= 0
                          );

                          if (_isNotExists) {
                            $local.data = $local.data?.filter(
                              (_target) => _target?.client?.id !== _isNotExists?.client?.id
                            );
                          }
                          $useDbStorage('booking', $local.data);
                        }
                      }
                    "
                  />
                </client-only>
              </template>
              <section class="grid grid-cols-12 gap-5 overflow-hidden">
                <atoms-image-native
                  class="cursor-pointer col-span-full md:col-span-2 bg-slate-100"
                  :height="$breakpoint.mdAndDown ? '100px' : 'auto'"
                  :src="__item.pictures?.[0]?.picture"
                  :alt="__item.pictures?.[0]?.description"
                >
                  <template #none
                    ><atoms-icon flat :size="25" name="file" class="!text-primary"
                  /></template>
                </atoms-image-native>
                <div class="space-y-5 col-span-full md:col-span-10">
                  <div>
                    <atoms-text span strong>{{ __item.title }}</atoms-text>
                    <atoms-text caption v-html="__item.description"></atoms-text>
                    <n-divider class="!my-2"></n-divider>
                    <div class="flex justify-between">
                      <atoms-text caption strong class="!text-primary">Room</atoms-text>
                      <atoms-text caption
                        >IDR {{ $addSeparator(__item.price || 0) }}/{{
                          __item.units || "rent"
                        }}</atoms-text
                      >
                    </div>
                    <div class="flex justify-between">
                      <atoms-text caption strong class="!text-primary">Amount</atoms-text>
                      <atoms-text caption>{{ __item.amount }}x</atoms-text>
                    </div>
                    <div class="flex justify-between">
                      <atoms-text caption strong class="!text-primary">Total</atoms-text>
                      <atoms-text caption
                        >IDR
                        {{ $addSeparator((__item.price || 0) * (__item.amount || 0)) }}</atoms-text
                      >
                    </div>
                    <div class="flex justify-between">
                      <atoms-text caption strong class="!text-primary capitalize"
                        >Check-in</atoms-text
                      >
                      <atoms-text caption>{{
                        moment(__item.startDate).format("DD MMMM YYYY, HH:mm A")
                      }}</atoms-text>
                    </div>
                    <div class="flex justify-between">
                      <atoms-text caption strong class="!text-primary capitalize"
                        >Check-out (Before)</atoms-text
                      >
                      <atoms-text caption>{{
                        moment(__item.endDate).format("DD MMMM YYYY, HH:mm A")
                      }}</atoms-text>
                    </div>
                  </div>
                </div>
              </section>
            </n-card>
          </section>
          <br />
        </section>
      </n-card>
      <br />
      <n-pagination
        v-if="$local.selectedSearch !== $searchType.Wishlist"
        class="flex flex-wrap gap-y-5"
        :disabled="$local.mainLoading"
        v-model:page="$local.page"
        :page-count="$local.raw?.pages || 1"
        @update:page="
          (_val) => {
            $onFetchMain({
              page: _val,
            });
          }
        "
      />
    </section>
    <atoms-empty
      v-else
      image=""
      :message="`Seems you have no '${Object.entries($searchType)
        .find(([_key, _val]) => _val == $local.selectedSearch)?.[0]
        ?.replaceAll('_', ' ')}' booking currently...`"
      class="bg-white dark:bg-black"
    ></atoms-empty>
    <br />
  </atoms-container>

  <!-- Review Modal -->
  <n-modal
    v-model:show="$local.showReviewModal"
    preset="card"
    title="Write a Review"
    :style="{ maxWidth: '500px' }"
    :mask-closable="false"
  >
    <div class="space-y-4">
      <div>
        <atoms-text caption strong class="!text-primary">Package</atoms-text>
        <atoms-text>{{ $local.reviewTarget?.productTitle || '-' }}</atoms-text>
      </div>
      <div>
        <atoms-text caption strong class="!text-primary">Rating</atoms-text>
        <br />
        <n-rate v-model:value="$local.reviewRate" :count="5" allow-half />
      </div>
      <div>
        <atoms-text caption strong class="!text-primary">Review</atoms-text>
        <n-input
          v-model:value="$local.reviewContent"
          type="textarea"
          placeholder="Share your experience..."
          :rows="4"
        />
      </div>
      <n-button
        type="primary"
        block
        :loading="$local.reviewLoading"
        :disabled="!$local.reviewContent || $local.reviewContent.length < 5"
        @click="$onSubmitReview"
        >Submit Review</n-button
      >
    </div>
  </n-modal>
</template>
