<script setup>
import {
  NForm,
  NButton,
  NTag,
  NDivider,
  NSkeleton,
  useNotification,
  NScrollbar,
  NCard,
  useLoadingBar,
} from "naive-ui";
import * as uuid from "uuid";
import { useVuelidate } from "@vuelidate/core";
import { required, email, minValue, requiredIf, helpers } from "@vuelidate/validators";

import { useAmenitiesStore } from "@/store/amenities";
import { useDetailStore } from "@/store/detail";
import { useProductStore } from "@/store/product";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";

const $detailStore = useDetailStore();
const { data: $dataDetail } = storeToRefs($detailStore);
const $amenitiesStore = useAmenitiesStore();
const { data: $dataAmenities } = storeToRefs($amenitiesStore);
const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);
const $productStore = useProductStore();

const $refund = `<p>- No refunding available</p><p>- No refund for cancellation within 24 hours before pickup time.</p><p>- 100% refund for cancellation over 24 hours before pickup time.</p>`;
const $reschedule = `<p>- No rescheduling available<br>- Reschedule can only be done at the latest 12 hours before pick-up time. <br>- Your rescheduled request is based on car availability. <br>- Reschedule is free of charge. However, if there is a price difference in the rental fee between the old and new schedule, the price difference will be borned to the passenger.</p>`;
const $classified = {
  Passenger: "Passenger",
  Payload: "Payload",
  Refund: "Refund",
  Reschedule: "Reschedule",
};

const $filterArrByCustom = (payload, target, by = "category") =>
  payload?.filter((_item) => _item?.[by?.toLowerCase()]?.toLowerCase() == target?.toLowerCase()) ||
  null;

const $findArrByCustom = (payload, target, by = "title") =>
  payload?.find((_item) => _item?.[by?.toLowerCase()]?.toLowerCase() == target?.toLowerCase()) ||
  null;

const { $api } = useApi();
const router = useRouter();
const route = useRoute();
const { $createError } = useError();
const { $removeSeparator, $addSeparator, $uploadFile } = useNuxtApp();
const $breakpoint = useBreakpoint();
const $loadingBar = useLoadingBar();
const $notification = useNotification();
const $accept = "image/png, image/jpeg, image/jpg, image/gif";
const $uploadAttachment = ref(null);
const $local = reactive({
  mainLoading: false,
  openImageEditor: false,
  detail: null,
  amountDetail: null,

  termAmenities: null,
  dataAmenities: null,
  dataDetail: null,

  update: null,
  passenger: null,
  payload: null,
  refund: $refund,
  reschedule: $reschedule,
});

const $model = reactive({
  title: null,
  units: null,
  amenities: null,
  price: null,
  details: null,
  description: null,
  pictures: null,
});

const $form = useVuelidate(
  {
    title: {
      required,
    },
    description: {
      required,
    },
    price: {
      minValue: minValue(1),
      required,
    },
    passenger: {
      custom: helpers.withMessage(
        () => `Required passenger`,
        (_value) => $findArrByCustom($model.details, $classified.Passenger)?.amount > 0 || false
      ),
    },
    payload: {
      custom: helpers.withMessage(
        () => `Required payload`,
        (_value) => $findArrByCustom($model.details, $classified.Payload)?.amount > 0 || false
      ),
    },
    amenitites: {
      custom: helpers.withMessage(
        () => `Required minimum of 1 service`,
        (_value) => $model.amenities?.length > 0 || false
      ),
    },
    pictures: {
      custom: helpers.withMessage(
        () => `Required minimum of 1 picture`,
        (_value) => $model.pictures?.length > 0 || false
      ),
    },
    driver: {
      custom: helpers.withMessage(
        () => `Required selection for driver`,
        (_value) => $findArrByCustom($model.details, "driver")?.amount != null || false
      ),
    },
    transmition: {
      custom: helpers.withMessage(
        () => `Required selection for transmittion`,
        (_value) =>
          $findArrByCustom($model.details, "automatic")?.amount > 0 ||
          $findArrByCustom($model.details, "manual")?.amount > 0 ||
          false
      ),
    },
  },
  $model
);

const $price = computed({
  get() {
    return $addSeparator($model.price || 0);
  },
  set(_val) {
    $model.price = Number($removeSeparator(_val));
  },
});

const $onFetchAmenities = async (_payload) => {
  $local.mainLoading = true;
  try {
    const _resp = await $amenitiesStore.get(null, {
      params: {
        filter: JSON.stringify({
          where: $local.termAmenities
            ? `CAST(types.title AS text) = '${$dataUser.value?.client?.type}' AND (amenities.title iLIKE '%${$local.termAmenities}%' OR CAST(amenities.category AS text) iLIKE '%${$local.termAmenities}%')`
            : `1=1`,
        }),
        type: $dataUser.value?.client?.type,
        limit: 50,
      },
    });

    if (_resp?.status) {
      $local.dataAmenities = _resp.result;
    }
  } catch (error) {
    $local.dataAmenities = null;
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onFetchDetail = async (_payload) => {
  $local.mainLoading = true;
  try {
    const _resp = await $detailStore.get(null, {
      params: {
        type: $dataUser.value?.client?.type,
      },
    });
    if (_resp?.status) {
      $local.dataDetail = _resp.result;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

// policies
const $onFetchPolicies = async (_payload) => {
  $local.mainLoading = true;
  try {
    const _resp = await $api.get(`policies?type=${$userStore.getClientType?.toLowerCase()}`);
    if (_resp?.status) {
      $local.dataPolicies = _resp?.result?.policies || _resp?.result;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onReset = () => {
  $form.value.$reset();
  Object.keys($model).forEach((_target) => {
    $model[_target] = null;
  });
  $onFetchDetail();
  $onFetchAmenities();
  $onFetchPolicies();
};

const $onSubmit = async () => {
  $local.mainLoading = true;
  try {
    if (!(await $form.value.$validate())) {
      $notification.warning({
        title: "Validation",
        content: "Please make sure all fields are filled",
      });
      return;
    }

    const id = route.params.id || uuid.v4();
    const _pictures = (
      await Promise.all(
        $model.pictures?.map(async (_item) => ({
          picture:
            _item?.picture ||
            (_item.rawSource
              ? await $uploadFile(_item.rawSource, `products/${id}`, `picture-${uuid.v4()}`)
              : null),
          title: `${$model.title}-${uuid.v4()}`,
          description: _item?.description || "-",
        }))
      )
    )?.filter((_item) => _item.picture);

    const _body = {
      ...$model,
      id,
      availability: $model.availability || true,
      pictures: _pictures,
      units: "day",
    };

    if ($local.refund?.length > 7) {
      const _target = $findArrByCustom($local.dataPolicies, $classified.Refund);
      _target.details = $local.refund;
      _body.policies = [...new Set([...(_body.policies || []), _target])];
    }

    if ($local.reschedule?.length > 7) {
      const _target = $findArrByCustom($local.dataPolicies, $classified.Reschedule);
      _target.details = $local.reschedule;
      _body.policies = [...new Set([...(_body.policies || []), _target])];
    }

    if ($local.refund?.length < 7 && $local.reschedule?.length < 7) {
      delete _body.policies;
    }

    // if (_body.policies?.length > 0) {
    //   _body.policies = _body.policies?.map(({ details, title }) => ({
    //     details,
    //     title,
    //   }));
    // }

    if (route.params.id) {
      const _policiesToUpdates = Array.apply(
        [],
        _body.policies?.filter((_item) =>
          $local.update?.policies?.find((__item) => __item.id == _item?.id)
        )
      );
      const _policiesToSubmit = Array.apply(
        [],
        _body.policies?.filter(
          (_item) => !$local.update?.policies?.find((__item) => __item.id == _item?.id)
        )
      );
      const _policiesToRemove = Array.apply(
        [],
        $local.update?.policies?.filter(
          (_item) => !_policiesToUpdates?.find((__item) => __item.id == _item?.id)
        )
      );

      console.log(_policiesToUpdates, _policiesToSubmit, _policiesToRemove);

      delete _body.policies;
      await $productStore.patch(`${route.params.id}`, _body);

      // todo: error backend
      if (_policiesToUpdates?.length > 0) {
        await Promise.all(
          _policiesToUpdates?.map(async ({ details, ..._item }) => {
            await $productStore.put(
              `${route.params.id}/policies/${_item?.id || _item?.policy_id}`,
              { details }
            );
            return _item;
          })
        );
      }

      if (_policiesToRemove?.length > 0) {
        await Promise.all(
          _policiesToRemove?.map(async ({ ..._item }) => {
            await $productStore.delete(
              `${route.params.id}/policies/${_item?.id || _item?.policy_id}`
            );
            return _item;
          })
        );
      }

      if (_policiesToSubmit?.length > 0) {
        await $productStore.post(`${route.params.id}/policies`, {
          policies: _policiesToSubmit?.map(({ title, details, ..._item }) => ({ title, details })),
        });
      }
    } else {
      const _policies = Array.apply([], _body.policies)?.map(({ title, details }) => ({
        title,
        details,
      }));
      delete _body.policies;
      await $productStore.submit(_body);
      await $productStore.post(`${_body.id}/policies`, { policies: _policies });
    }

    $notification.success({
      title: "Success",
      content: `Your car type (${_body.title}) was successfully saved`,
    });

    $onReset();
    router.push({ path: "/admin/car-rent/cars" });
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $getDetail = (payload, target) =>
  payload?.find((_item) => _item.title?.toLowerCase() == target?.toLowerCase());

onMounted(async () => {
  $local.mainLoading = true;
  try {
    $onReset();

    if (route.params.id) {
      const _resp = await $productStore.get(`${route.params.id}`);
      if (_resp?.status) {
        Object.keys($model).forEach((_target) => {
          $model[_target] = _resp?.result?.[_target] || null;
        });
        $local.update = _resp?.result;
      } else {
        throw new Error("Failed to get car");
      }

      $local.passenger = $findArrByCustom(_resp?.result?.details, $classified.Passenger)?.amount;
      $local.payload = $findArrByCustom(_resp?.result?.details, $classified.Payload)?.amount;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
});

watch(
  () => $local.mainLoading,
  (_val) => {
    if (_val) $loadingBar.start();
    else setTimeout(() => $loadingBar.finish(), 500);
  }
);

definePageMeta({
  title: "Submit Car Type",
  validation: ({ _user }) => {
    if (!_user?.scope?.includes("admin")) return "/";
  },
});
</script>
<template>
  <molecules-modal
    title="Picture Uploader"
    v-model:show="$local.openImageEditor"
    :style="{
      width: $breakpoint.mdAndDown ? '90%' : '600px',
    }"
    @closed="
      (_val) => {
        if (_val) {
          $model.pictures = [...($model.pictures || []), ...(_val || [])];
        }
        $local.openImageEditor = false;
      }
    "
  >
    <molecules-image-editor
      :camera="{
        disabled: true,
      }"
      :max="10"
    />
  </molecules-modal>
  <atoms-container>
    <atoms-heading h2>{{ route.params.id ? "Update" : "Add" }} Car Type</atoms-heading>
    <!-- Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua -->
    <n-form id="submit-main-form" @submit.prevent="$onSubmit">
      <section class="grid grid-cols-1 md:grid-cols-2 md:gap-x-5">
        <n-divider class="col-span-full" title-placement="left"
          ><atoms-text caption>Basic Information</atoms-text></n-divider
        >
        <atoms-input
          :disabled="$local.mainLoading"
          class="col-span-2 lg:col-span-1"
          placeholder="Type your car name"
          :isError="$form.title.$error"
          :errors="$form.title.$errors"
          v-model:value="$model.title"
          label="Name"
          clearable
          required
        />
        <atoms-input
          class="col-span-2 lg:col-span-1"
          placeholder="Type something..."
          label="Price"
          v-model:value="$price"
          :isError="$form.price.$error"
          :errors="$form.price.$errors"
          :disabled="$local.mainLoading"
          required
          ><template #prepend> <n-button>Rp</n-button> </template>
        </atoms-input>

        <atoms-input-number
          :disabled="$local.mainLoading"
          class="col-span-2 lg:col-span-1"
          v-model:value="$local.passenger"
          :isError="$form.passenger.$error"
          :errors="$form.passenger.$errors"
          label="Passenger"
          @update:value="
            () => {
              const _target = $findArrByCustom($local.dataDetail, $classified.Passenger);
              const _body = JSON.parse(
                JSON.stringify({
                  id: _target?.id,
                  title: _target?.title,
                  amount: $local.passenger,
                })
              );
              if ($findArrByCustom($model.details, $classified.Passenger)) {
                $model.details = $model.details?.filter((_item) => _item.id != _target?.id);
              }
              $model.details = [...new Set([...($model.details || []), _body])];
            }
          "
          :min="1"
          clearable
          required
        />

        <atoms-input-number
          :disabled="$local.mainLoading"
          class="col-span-2 lg:col-span-1"
          v-model:value="$local.payload"
          :isError="$form.payload.$error"
          :errors="$form.payload.$errors"
          label="Payload (Baggage)"
          @update:value="
            () => {
              const _target = $findArrByCustom($local.dataDetail, $classified.Payload);
              const _body = JSON.parse(
                JSON.stringify({
                  id: _target?.id,
                  title: _target?.title,
                  amount: $local.payload,
                })
              );
              if ($findArrByCustom($model.details, $classified.Payload)) {
                $model.details = $model.details?.filter((_item) => _item.id != _target?.id);
              }
              $model.details = [...new Set([...($model.details || []), _body])];
            }
          "
          :min="1"
          clearable
          required
        />

        <atoms-input
          :disabled="$local.mainLoading"
          v-model:value="$model.description"
          :isError="$form.description.$error"
          :errors="$form.description.$errors"
          class="col-span-full"
          type="textarea"
          label="Description"
          clearable
          required
        />

        <br class="col-span-full" />

        <section class="col-span-full">
          <section>
            <n-divider title-placement="left" class="col-span-full !mt-0">
              <atoms-text span>Services</atoms-text>
            </n-divider>
            <atoms-input
              :disabled="$local.mainLoading"
              class="col-span-2 lg:col-span-1"
              placeholder="Search by service's name or category..."
              v-model:value="$local.termAmenities"
              @key.enter="$onFetchAmenities"
              required
            >
              <template #append>
                <n-button
                  type="error"
                  @click="
                    () => {
                      $local.termAmenities = null;
                      $onFetchAmenities();
                    }
                  "
                  >Reset</n-button
                >
                <n-button type="primary" @click="$onFetchAmenities">Search</n-button>
              </template>
            </atoms-input>
            <section>
              <n-skeleton
                v-if="$local.mainLoading"
                type="card"
                height="100px"
                class="col-span-full w-full mb-5"
              />
              <div v-else-if="$local.dataAmenities?.length > 0" class="col-span-full space-y-2">
                <n-scrollbar x-scrollable trigger="none">
                  <atoms-form
                    :isError="$form.amenitites.$error"
                    :errors="$form.amenitites.$errors"
                    required
                  >
                    <div class="flex gap-x-5">
                      <n-card
                        v-for="(_amenities, _iamenities) in $local.dataAmenities"
                        :key="_iamenities"
                        size="small"
                        :class="[
                          'w-[10rem]  hover:shadow-md !cursor-pointer',
                          $model.amenities?.find((_it) => _it.id == _amenities.id)
                            ? 'bg-primary'
                            : '',
                        ]"
                        @click.stop="
                          () => {
                            if ($model.amenities?.find((_it) => _it.id == _amenities.id)) {
                              $model.amenities = $model.amenities?.filter(
                                (_item) => _item.id !== _amenities.id
                              );
                            } else {
                              $model.amenities = [
                                ...new Set([...($model.amenities || []), _amenities]),
                              ];
                            }
                          }
                        "
                      >
                        <div
                          class="flex flex-col items-center justify-center text-center h-full w-full"
                        >
                          <atoms-icon class="!text-inherit" name="information" flat></atoms-icon>
                          <atoms-text caption>{{ _amenities.title }}</atoms-text>
                          <atoms-text caption>({{ _amenities.category }})</atoms-text>
                        </div>
                      </n-card>
                    </div>
                  </atoms-form>
                </n-scrollbar>
              </div>
              <atoms-empty
                v-else
                height="100"
                image=""
                class="col-span-full w-full"
                message="Services not found"
              />
            </section>
            <br />
            <section>
              <section v-if="$model.amenities?.length > 0" class="col-span-full space-y-2">
                <n-card v-for="(_item, _iitem) in $model.amenities" :key="_iitem" size="small">
                  <div class="grid grid-cols-2">
                    <div class="col-span-1">
                      <atoms-text strong class="capitalize">{{ _item.title }}</atoms-text>
                      <atoms-text caption>Category : {{ _item.category }}</atoms-text>
                    </div>
                    <div class="col-span-1 flex justify-end gap-2">
                      <atoms-icon
                        flat
                        name="close"
                        :disabled="$local.mainLoading"
                        :size="20"
                        @click="
                          $model.amenities = $model.amenities?.filter((_it) => _it.id !== _item.id)
                        "
                      ></atoms-icon>
                    </div>
                  </div>
                </n-card>
                <br />
              </section>
              <section v-else>
                <atoms-empty
                  image=""
                  height="15vh"
                  message="None of Services were added"
                ></atoms-empty>
                <br />
              </section>
            </section>
          </section>
        </section>
        <br class="col-span-full" />

        <n-divider class="col-span-full" title-placement="left"
          ><atoms-text>Status Driver</atoms-text></n-divider
        >

        <atoms-form
          :isError="$form.driver.$error"
          :errors="$form.driver.$errors"
          required
          class="col-span-full"
        >
          <section class="w-full grid md:grid-cols-2 gap-5">
            <n-card
              @click.stop="
                () => {
                  const lastDetail = $findArrByCustom($model.details, 'driver');
                  if (lastDetail) {
                    $model.details = $model.details?.filter((_item) => _item.id != lastDetail.id);
                  }
                  const driver = $findArrByCustom($local.dataDetail, 'driver');
                  $model.details = [
                    ...($model.details || []),
                    {
                      ...(driver || {}),
                      amount: 1,
                    },
                  ];
                }
              "
              :class="[
                'col-span-full md:col-span-1 !cursor-pointer',
                $getDetail($model.details, 'driver')?.amount > 0 ? 'bg-primary' : '',
              ]"
            >
              <n-space align="center" justify="center">
                <atoms-text strong span>With Driver</atoms-text>
              </n-space>
            </n-card>
            <n-card
              @click.stop="
                () => {
                  const lastDetail = $getDetail($model.details, 'driver');
                  if (lastDetail) {
                    $model.details = $model.details?.filter((_item) => _item.id != lastDetail.id);
                  }
                  const driver = $getDetail($local.dataDetail, 'driver');
                  $model.details = [
                    ...($model.details || []),
                    {
                      ...(driver || {}),
                      amount: 0,
                    },
                  ];
                }
              "
              :class="[
                'col-span-full md:col-span-1 !cursor-pointer',
                $getDetail($model.details, 'driver')?.amount < 1 ? 'bg-primary' : '',
              ]"
            >
              <n-space align="center" justify="center">
                <atoms-text strong span>Without Driver</atoms-text>
              </n-space>
            </n-card>
          </section>
        </atoms-form>

        <br class="col-span-full" />

        <n-divider class="col-span-full" title-placement="left"
          ><atoms-text>Transmition Car</atoms-text></n-divider
        >

        <atoms-form
          :isError="$form.transmition.$error"
          :errors="$form.transmition.$errors"
          required
          class="col-span-full"
        >
          <section class="w-full grid md:grid-cols-2 gap-5">
            <n-card
              :class="[
                'col-span-full md:col-span-1 !cursor-pointer',
                $getDetail($model.details, 'manual')?.amount > 0 ? 'bg-primary' : '',
              ]"
              @click.stop="
                () => {
                  const lastDetail = $getDetail($model.details, 'manual');
                  const auto = $getDetail($model.details, 'automatic');
                  if (auto) {
                    $model.details = $model.details?.filter((_item) => _item.id != auto.id);
                  }
                  if (lastDetail) {
                    $model.details = $model.details?.filter((_item) => _item.id != lastDetail.id);
                  }
                  const manual = $getDetail($local.dataDetail, 'manual');
                  $model.details = [
                    ...($model.details || []),
                    {
                      ...(manual || {}),
                      amount: 1,
                    },
                  ];
                }
              "
            >
              <n-space align="center" justify="center">
                <atoms-text strong span>Manual</atoms-text>
              </n-space>
            </n-card>
            <n-card
              :class="[
                'col-span-full md:col-span-1 !cursor-pointer',
                $getDetail($model.details, 'automatic')?.amount > 0 ? 'bg-primary' : '',
              ]"
              @click.stop="
                () => {
                  const lastDetail = $getDetail($model.details, 'automatic');
                  const manual = $getDetail($model.details, 'manual');
                  if (manual) {
                    $model.details = $model.details?.filter((_item) => _item.id != manual.id);
                  }
                  if (lastDetail) {
                    $model.details = $model.details?.filter((_item) => _item.id != lastDetail.id);
                  }
                  const automatic = $getDetail($local.dataDetail, 'automatic');
                  $model.details = [
                    ...($model.details || []),
                    {
                      ...(automatic || {}),
                      amount: 1,
                    },
                  ];
                }
              "
            >
              <n-space align="center" justify="center">
                <atoms-text strong span>Automatic</atoms-text>
              </n-space>
            </n-card>
          </section>
        </atoms-form>
      </section>

      <br class="col-span-full" />
      <n-divider class="col-span-full" />
      <br class="col-span-full" />

      <atoms-form class="col-span-full">
        <client-only>
          <molecules-rich-text-editor
            hide-attachments
            hide-image
            title="Refund"
            class="col-span-full"
            :value="$local.refund"
            base-path="products/refund"
            :base-id="$userStore.getClientTypeApp"
            :disabled="$local.mainLoading"
            @update="
              (_val) => {
                $local.refund = _val;
              }
            "
          />
        </client-only>
      </atoms-form>

      <n-button @click="$local.refund = $refund"> Reset </n-button>

      <n-divider class="col-span-full" />
      <br class="col-span-full" />

      <atoms-form class="col-span-full">
        <client-only>
          <molecules-rich-text-editor
            hide-attachments
            hide-image
            title="Reschedule"
            class="col-span-full"
            :value="$local.reschedule"
            base-path="products/reschedule"
            :base-id="$userStore.getClientTypeApp"
            :disabled="$local.mainLoading"
            @update="(_val) => ($local.reschedule = _val)"
          />
        </client-only>
      </atoms-form>
      <n-button @click="$local.reschedule = $reschedule"> Reset </n-button>
      <br class="col-span-full" />

      <n-divider class="col-span-full" title-placement="left">
        <div class="flex items-center gap-5">
          <atoms-text>Pictures</atoms-text>
          <n-button
            :disabled="$local.mainLoading"
            @click="
              () => {
                $local.openImageEditor = true;
              }
            "
            >Open Picture Uploader</n-button
          >
        </div>
      </n-divider>

      <atoms-form
        :isError="$form.pictures.$error"
        :errors="$form.pictures.$errors"
        required
        class="col-span-full"
      >
        <div
          v-if="$model.pictures?.length > 0"
          class="flex gap-5 bg-white-smoke dark:bg-black p-2 overflow-x-auto mt-5"
        >
          <div
            v-for="(_file, _ifile) in $model.pictures"
            :key="_ifile"
            class="min-w-[250px] min-h-[150px] bg-white-smoke dark:bg-black rounded-sm relative top-0 left-0 flex p-2 items-center justify-center"
            :style="{
              'background-image': `url('${_file.source || _file.picture}')`,
              'background-size': 'cover',
              ' background-position': 'top',
            }"
          >
            <atoms-text v-if="!_file.blob?.contentType?.includes('image')" class="">{{
              _file.blob?.contentType?.split("/")?.[1]?.toUpperCase()?.substring(0, 20) || "-"
            }}</atoms-text>
            <div
              class="flex absolute top-0 left-0 flex-col justify-start min-w-[250px] min-h-[150px] bg-black bg-opacity-50 p-2"
            >
              <div class="flex justify-between items-center">
                <n-tag type="info" size="small" class="bg-white">{{
                  _file.blob?.contentType?.length > 20
                    ? _file.blob?.contentType?.substring(0, 20) + "..."
                    : _file.blob?.contentType || "file"
                }}</n-tag>
                <atoms-icon
                  flat
                  :size="25"
                  class="!text-white"
                  name="close"
                  :disabled="$local.mainLoading || _file.deletable"
                  @click="
                    () =>
                      ($model.pictures = $model.pictures?.filter(
                        (__file) => __file?.id != _file.id
                      ))
                  "
                />
              </div>
              <atoms-text :link="_file.source || _file.picture" class="mt-auto !text-white">
                {{ _file.name || _file.title }}</atoms-text
              >
            </div>
          </div>
        </div>

        <atoms-empty v-else image="" span message=" ">
          <div class="flex flex-wrap justify-center items-center text-center gap-2">
            <atoms-text>(Minimum 1) You can upload pictures for your car type by open</atoms-text>
            <atoms-text @click="$local.openImageEditor = true">Picture Uploader.</atoms-text>
          </div>
        </atoms-empty>
      </atoms-form>

      <n-button attr-type="submit" type="primary" class="w-full" :disabled="$local.mainLoading"
        >Save Car Type</n-button
      >
    </n-form>

    <br />
    <br />
  </atoms-container>
</template>
