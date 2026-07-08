<script setup>
import {
  NDropdown,
  NCard,
  NDivider,
  NSkeleton,
  NButton,
  NTag,
  NAlert,
  NPagination,
  NScrollbar,
  NSpace,
  NStatistic,
  NNumberAnimation,
  NCollapseTransition,
  useNotification,
  useLoadingBar,
} from "naive-ui";
import { useUserStore } from "@/store/user";
import { useProductStore } from "@/store/product";
import { useOrderStore } from "@/store/order";
import { useClientStore } from "@/store/client";
import { storeToRefs } from "pinia";
import moment from "moment";
// moment.locale("id");

const $clientStore = useClientStore();
const $productStore = useProductStore();
const $orderStore = useOrderStore();
const { data: $dataOrder } = storeToRefs($orderStore);
const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);

const $statusType = {
  History: "1=1",
  Process: "orders.status='process'",
  Complete: "orders.status='progress'",
  Succeed: "orders.status='done'",
  Cancelled: "orders.status='cancelled'",
};

const route = useRoute();
const router = useRouter();
const $loadingBar = useLoadingBar();
const $notification = useNotification();
const { $addSeparator, $dateHours } = useNuxtApp();
const { $createError } = useError();
const $breakpoint = useBreakpoint();
const $local = reactive({
  term: null,
  openOrderItemsSection: null,
  selectedSearch: $statusType.History,
  mainLoading: false,
  openFilter: false,

  data: null,
  raw: null,
  page: 1,
  limit: 10,
});

const $onFetchMain = async (_payload) => {
  $local.mainLoading = true;
  try {
    $local.page = _payload?.page || 1;
    const _limit = _payload?.limit || 5;
    const _page = $local.page;
    const _resp = await $orderStore.get(null, {
      params: {
        filter: JSON.stringify({
          where: $local.selectedSearch.toLowerCase(),
          order: "_created_date DESC",
        }),
        page: _page,
        limit: _limit,
      },
    });
    if (_resp.status) {
      $local.data = _resp?.result;
      $local.raw = _resp;
    }
    // console.log($local.raw);
  } catch (error) {
    $local.data = null;
    $local.raw = null;
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onUpdate = async (_body = null, _path = null) => {
  $local.mainLoading = true;
  try {
    await $orderStore.put(_path, _body);
    // todo:force update
    await $onFetchMain();
    $notification.success({
      title: "Status",
      content: "Data successfully updated",
    });
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onCheckApprovalAndUpdate = async (_payload) => {
  console.log("🟡 Checking order:", _payload.id);
  let unavailableList = [];
  $local.mainLoading = true;
  try {
    if (!Array.isArray(_payload?.items)) {
      console.warn("⚠️ Order items not valid array:", _payload?.items);
      return;
    }
    await Promise.all(
      _payload.items.map(async (_item) => {
        try {
          const totalItems = await $productStore
            .get(`${_item.product_id}/items`)
            .then((_resp) => {
              const count = _resp?.result?.items?.length || 0;
              console.log("✅ totalItems:", count, _item.product_id);
              return count;
            })
            .catch((err) => {
              console.error("❌ Error get totalItems:", err);
              return 0;
            });

          const startISO = new Date($dateHours(_payload.start_date, 12)).toISOString();
          const endISO = new Date($dateHours(_payload.end_date, 12)).toISOString();

          const totalUnavailable = await $productStore
            .get(`unavailable`, {
              params: {
                filter: JSON.stringify({
                  where: `product_id = '${_item.product_id}' AND start_date >= '${startISO}' AND start_date <= '${endISO}'`,
                }),
              },
            })
            .then((_resp) => {
              const count = _resp?.count || 0;
              console.log("❗ totalUnavailable:", count, _item.product_id);
              return count;
            })
            .catch((err) => {
              console.error("❌ Error get unavailable:", err);
              return 0;
            });

          if (totalItems - totalUnavailable <= 0) {
            unavailableList.push(_item);
          }
        } catch (err) {
          console.error("❌ Error per item:", err);
        }
      })
    );
    // await Promise.all(
    //   await _payload?.items?.map(async (_item) => {
    //     try {
    //       const totalItems = await $productStore
    //         .get(`${_item.product_id}/items`)
    //         .then((_resp) => _resp?.result?.items?.length || 0)
    //         .catch((err) => 0);
    //       // console.log(await $productStore.get(`unavailable`));

    //       const totalUnavailable = await $productStore
    //         .get(`unavailable`, {
    //           params: {
    //             filter: JSON.stringify({
    //               where: `product_id = '${_item.product_id}' AND start_date >= '${new Date(
    //                 $dateHours(_payload?.start_date, 12)
    //               ).toISOString()}' AND start_date <= '${new Date(
    //                 $dateHours(_payload?.end_date, 12)
    //               ).toISOString()}'`,
    //             }),
    //           },
    //         })
    //         .then((_resp) => _resp?.count || 0)
    //         .catch((err) => 0);

    //       // console.log(totalUnavailable, totalItems, totalItems - totalUnavailable);
    //       if (totalItems - totalUnavailable <= 0) {
    //         unavailableList.push(_item);
    //       }
    //     } catch (error) {}
    //   })
    // );

    if (unavailableList?.length <= 0 && confirm("Are you sure to confirm")) {
      await $onUpdate(null, `${_payload.id}/confirmation/progress`);
      await $onFetchMain({ page: 1 });
    } else {
      _payload.unavailable = true;
      throw new Error(
        `Cannot update status due to unavailable item for ${unavailableList?.map(
          (_item) => _item?.title
        )}`
      );
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

watch(
  () => $local.selectedSearch,
  async (_val) => {
    $onFetchMain({ page: 1 });
  }
);

onMounted(() => {
  $onFetchMain();
});

definePageMeta({
  order: 6,
  label: "Order",
  navigator: ({ _user }) => {
    if (
      !_user?.scope?.includes("admin") ||
      (!_user?.client?.type?.includes("hotel") && !_user?.client?.type?.includes("car"))
    )
      return false;
    return true;
  },
  validation: ({ _user }) => {
    if (
      !_user?.scope?.includes("admin") ||
      (!_user?.client?.type?.includes("hotel") && !_user?.client?.type?.includes("car"))
    )
      return "/";
  },
});
</script>
<template>

  <atoms-container>
    <br />
    <n-card :title="`${moment($dateHours()).format('dddd, DD MMMM YYYY')}`">
      <template #header-extra>
        <atoms-icon name="refresh"></atoms-icon>
      </template>
      <div class="grid md:grid-cols-3">
        <n-statistic label="Total Order">
          <div>
            <n-number-animation
              ref="$countAnimationInstRef"
              show-separator
              :from="0"
              :to="$local.raw?.count || 0"
              :active="true"
            />
          </div>
        </n-statistic>
        <n-statistic label="Value Total">
          <div>
            <span>IDR </span>
            <n-number-animation
              ref="$totalAnimationInstRef"
              show-separator
              :from="0"
              :to="
                $local.data?.map((_item) => +_item.total)?.reduce((_curr, _acc) => _curr + _acc, 0)
              "
              :active="true"
            />
          </div>
        </n-statistic></div
    ></n-card>
    <br />
    <n-space>
      <n-button
        v-for="([_itemKey, _itemVal], _iitem) in Object.entries($statusType)"
        :key="_iitem"
        :type="$local.selectedSearch == _itemVal ? 'primary' : undefined"
        @click="$local.selectedSearch = _itemVal"
        >{{ _itemKey?.replaceAll("_", " ") }}</n-button
      >
    </n-space>
    <br />
    <section v-if="$local.mainLoading" class="space-y-5">
      <n-skeleton card height="150px" :repeat="5"></n-skeleton>
    </section>
    <section v-else-if="$local.data?.length > 0" class="space-y-5">
      <n-divider title-placement="left" class="!mt-0">
        <atoms-text span
          >Showing {{ $local.data?.length }} from {{ $local.raw?.count || 0 }} data</atoms-text
        >
      </n-divider>
      <!-- {{ $local.data }} -->
      <section class="space-y-2">
        <n-card v-for="(_item, _iitem) in $local.data" :key="_iitem">
          <template #header>
            <atoms-heading h4 class="!uppercase"
              >ORD{{
                String(_item.id)?.slice(0, 3) +
                moment(_item.start_date).format("DDMMYY") +
                +moment(_item._created_date).format("HHmmss")
              }}</atoms-heading
            >
          </template>
          <!-- <template #header-extra>
            <atoms-icon name="delete"></atoms-icon>
          </template> -->
          <div v-if="$local.selectedSearch == $statusType.On_Progress">
            <n-alert type="info">
              <atoms-text caption>Please wait for customer to confirm the order</atoms-text>
            </n-alert>
            <br />
          </div>
          <n-divider title-placement="left" class="!mt-0">
            <n-space>
              <n-button
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
                    <atoms-text caption>{{ __item.description }}</atoms-text>
                    <n-divider class="!my-2"></n-divider>

                    <div class="flex justify-between">
                      <atoms-text caption strong class="!text-primary">Amount</atoms-text>
                      <atoms-text span>{{ __item.quantity }}x</atoms-text>
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
            <div>
              <atoms-text caption strong class="!text-primary capitalize">Status</atoms-text>
              <atoms-text class="capitalize">{{ _item.status }}</atoms-text>
            </div>
            <div>
              <atoms-text caption strong class="!text-primary capitalize">Total</atoms-text>
              <atoms-text>IDR {{ $addSeparator(Number(_item.total || 0)) }}</atoms-text>
            </div>
          </section>
          <br />
          <n-space
            v-if="
              !String(_item.status).includes('cancelled') && !String(_item.status).includes('done')
            "
          >
            <n-button
              v-if="
                !String(_item.status).includes('progress') && !String(_item.status).includes('done')
              "
              :type="_item?.unavailable ? 'error' : 'primary'"
              class="w-full md:w-auto"
              @click="() => $onCheckApprovalAndUpdate(_item)"
              >{{ _item?.unavailable ? "Unavailable Order" : "Available to Approval" }}</n-button
            >
            <n-button
              v-if="
                !String(_item.status).includes('progress') && !String(_item.status).includes('done')
              "
              :type="'error'"
              class="w-full md:w-auto"
              @click="
                () => {
                  if ($window.confirm('Are you sure to cancel this order? this cannot be undone')) {
                    $onUpdate(null, `${_item.id}/confirmation/cancelled`);
                  }
                }
              "
              >Cancel</n-button
            >

            <!-- <n-button
              v-if="!String(_item.status).includes('done')"
              type="primary"
              class="w-full md:w-auto"
              @click="$onUpdate(null, `${_item.id}/confirmation/cancelled`)"
              >Mark as Complete</n-button
            > -->
          </n-space>

        </n-card>
      </section>

      <n-pagination
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

    <atoms-empty v-else message="None of orders been added" size="250"></atoms-empty>
    <br />
    <br />
  </atoms-container>
</template>
