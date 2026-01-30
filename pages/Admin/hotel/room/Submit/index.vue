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
import { required, email, minValue } from "@vuelidate/validators";

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

const router = useRouter();
const route = useRoute();
const { $createError } = useError();
const { $api } = useApi();
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

  update: null,
  termAmenities: null,
  termPolicies: null,
  policy: null,
  policyDetails: null,
  dataPolicies: null,
  dataAmenities: null,
  dataDetail: null,
});

const $model = reactive({
  title: null,
  units: null,
  amenities: null,
  price: null,
  details: null,
  policies: null,
  description: null,
  pictures: null,
});

const $filterArrByCustom = (payload, target, by = "category") =>
  payload?.filter((_item) => _item?.[by?.toLowerCase()]?.toLowerCase() == target?.toLowerCase()) ||
  null;

const $findArrByCustom = (payload, target, by = "title") =>
  payload?.find((_item) => _item?.[by?.toLowerCase()]?.toLowerCase() == target?.toLowerCase()) ||
  null;

const $form = useVuelidate(
  {
    title: {
      required,
    },
    units: {
      required,
    },
    amenities: {
      required,
    },
    description: {
      required,
    },
    price: {
      minValue: minValue(1),
      required,
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
            ? `amenities.title iLIKE '%${$local.termAmenities}%' OR CAST(amenities.category AS text) iLIKE '%${$local.termAmenities}%'`
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
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

// policies
// policies
const $onFetchPolicies = async () => {
  $local.mainLoading = true;
  try {
    const _type = $dataUser.value?.client?.type || $userStore.getClientType || null;

    const endpoint = _type ? `/policies?type=${encodeURIComponent(_type)}` : `/policies`;

    const _resp = await $api.get(endpoint);

    const _res = _resp?.result ?? _resp;
    $local.dataPolicies = Array.isArray(_res) ? _res : _res?.policies ?? [];
  } catch (error) {
    $local.dataPolicies = [];
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

const $onReset = async () => {
  $form.value.$reset();
  Object.keys($model).forEach((_target) => {
    $model[_target] = null;
  });
  await $onFetchDetail();
  await $onFetchAmenities();
  await $onFetchPolicies();
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
    if (!$model.details || $model.details?.length == 0) {
      $notification.warning({
        title: "Validation",
        content: "Please add one detail",
      });
      return;
    }
    if (!$model.pictures || $model.pictures?.length == 0) {
      $notification.warning({
        title: "Validation",
        content: "Please add one picture",
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
      // details: $model.details?.map((_item) => ({ title: _item.title, amount: _item.amount })),
      // amenities: $model.amenities?.map((_item) => _item.title),
    };

    if (route.params.id) {
      // todo: error backend
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
      content: `Your room type (${_body.title}) was successfully saved`,
    });

    $onReset();
    router.push({ path: "/admin/hotel/room" });
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

onMounted(async () => {
  $local.mainLoading = true;
  try {
    await $onReset();

    if (route.params.id) {
      const _resp = await $productStore.get(`${route.params.id}`);
      if (_resp?.status) {
        Object.keys($model).forEach((_target) => {
          $model[_target] = _resp?.result?.[_target] || null;
        });
        $local.update = _resp?.result;
      } else {
        throw new Error("Failed to get room");
      }
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
  // navigator: true,
  title: "Submit Room Type",
  //   navigator: ({ _user }) => {
  //     if (!_user?.scope?.includes("admin")) return false;
  //     return true;
  //   },
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
    <br />
    <atoms-heading h2>{{ route.params.id ? "Update" : "Create" }} Room Type</atoms-heading>

    <n-form id="submit-main-form" @submit.prevent="$onSubmit">
      <section class="grid grid-cols-1 md:grid-cols-2 md:gap-x-5">
        <n-divider class="col-span-full" title-placement="left"
          ><atoms-text caption>Basic Information</atoms-text></n-divider
        >
        <atoms-input
          :disabled="$local.mainLoading"
          class="col-span-full"
          placeholder="Type your room name"
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
          ><template #prepend> <n-button>IDR</n-button> </template>
        </atoms-input>
        <atoms-input
          :disabled="$local.mainLoading"
          class="col-span-2 lg:col-span-1"
          placeholder="Type your room unit (ex. night, etc..)"
          :isError="$form.units.$error"
          :errors="$form.units.$errors"
          v-model:value="$model.units"
          label="Units"
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
        <br />
        <!-- amenities -->
        <section class="col-span-full">
          <section>
            <n-divider title-placement="left" class="col-span-full !mt-0">
              <atoms-text span>Amenities</atoms-text>
            </n-divider>
            <atoms-input
              :disabled="$local.mainLoading"
              class="col-span-2 lg:col-span-1"
              placeholder="Search by amenity's name or category..."
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
              <div v-if="$local.dataAmenities?.length > 0" class="space-y-2 col-span-full">
                <n-scrollbar x-scrollable trigger="none">
                  <atoms-form
                    :isError="$form.amenities.$error"
                    :errors="$form.amenities.$errors"
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
                          class="flex flex-col items-center justify-center w-full h-full text-center"
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
              <n-skeleton v-else type="card" height="100px" class="w-full mb-5 col-span-full" />
            </section>
            <section>
              <section v-if="$model.amenities?.length > 0" class="space-y-2 col-span-full">
                <n-card v-for="(_item, _iitem) in $model.amenities" :key="_iitem" size="small">
                  <div class="grid grid-cols-2">
                    <div class="col-span-1">
                      <atoms-text strong class="capitalize">{{ _item.title }}</atoms-text>
                      <atoms-text caption>Category : {{ _item.category }}</atoms-text>
                    </div>
                    <div class="flex justify-end col-span-1 gap-2">
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
                  message="None of Halal Service were added"
                ></atoms-empty>
                <br />
              </section>
            </section>
          </section>
        </section>

        <!-- <div v-if="$local.dataAmenities?.length > 0" class="space-y-2 col-span-full">
          <atoms-text span class="">Select your type aminities</atoms-text>
          <n-scrollbar x-scrollable>
            <atoms-form
              :isError="$form.amenities.$error"
              :errors="$form.amenities.$errors"
              required
            >
              <div class="flex gap-x-5">
                <n-card
                  v-for="(_amenities, _iamenities) in $local.dataAmenities"
                  :key="_iamenities"
                  :class="[
                    'w-[10rem] h-[5rem] hover:shadow-md !cursor-pointer',
                    $model.amenities?.find((_it) => _it.id == _amenities.id) ? 'bg-primary' : '',
                  ]"
                  @click="
                    () => {
                      if ($model.amenities?.find((_it) => _it.id == _amenities.id)) {
                        $model.amenities = $model.amenities?.filter(
                          (_item) => _item.id !== _amenities.id
                        );
                      } else {
                        $model.amenities = [...new Set([...($model.amenities || []), _amenities])];
                      }
                    }
                  "
                >
                  <div class="flex flex-col items-center justify-center w-full h-full text-center">
                    <atoms-text caption class="!text-inherit">{{ _amenities.title }}</atoms-text>
                  </div>
                </n-card>
              </div>
            </atoms-form>
          </n-scrollbar>
        </div>
        <n-skeleton v-else type="card" height="100px" class="w-full mb-5 col-span-full" /> -->
        <br />
        <n-divider class="col-span-full" title-placement="left"
          ><atoms-text>Detail Room</atoms-text></n-divider
        >

        <div class="grid grid-cols-2 col-span-full gap-x-5">
          <!-- <atoms-input
            :disabled="$local.mainLoading"
            class="col-span-2 lg:col-span-1"
            label="Title"
            placeholder="Type something like double bed (bed size) or guest (allowed guest in one room)..."
            v-model:value="$local.detail"
            clearable
            required
          /> -->
          <atoms-select
            class="col-span-2 lg:col-span-1"
            label="Select Detail"
            :options="
              $local.dataDetail?.map((_detail) => ({
                label: _detail.title,
                value: _detail,
              })) || []
            "
            v-model:value="$local.detail"
            :disabled="$local.mainLoading"
            required
            clearable
          />
          <atoms-input-number
            :min="1"
            class="col-span-2 lg:col-span-1"
            placeholder="Type something like 1/2/3..."
            label="Amount"
            v-model:value="$local.amountDetail"
            :disabled="$local.mainLoading"
            required
          />
        </div>
        <n-button
          :disabled="$local.mainLoading"
          type="primary"
          class="col-span-full"
          @click="
            () => {
              if (!$local.detail || !$local.amountDetail) {
                return $notification.warning({
                  title: 'Attention',
                  content: 'Please make sure detail fields are filled',
                });
              }

              const _body = {
                id: $local.detail?.id,
                title: $local.detail?.title,
                amount: $local.amountDetail,
              };

              if ($model.details?.find((__item) => __item.id == $local.detail?.id)) {
                $model.details = $model.details?.filter((__item) => __item.id !== _body.id);
              }

              $model.details = [...new Set([...($model.details || []), _body])];
              $local.detail = null;
              $local.amountDetail = null;
            }
          "
          >Add detail</n-button
        >

        <br class="col-span-full" />

        <div v-if="$model.details?.length > 0" class="space-y-2 col-span-full">
          <n-card v-for="(_item, _iitem) in $model.details" :key="_iitem" size="small">
            <div class="grid grid-cols-2">
              <div class="col-span-1">
                <atoms-text strong>{{ _item.title }}</atoms-text>
                <atoms-text caption>Amount : {{ _item.amount }}</atoms-text>
              </div>
              <div class="flex justify-end col-span-1 gap-2">
                <atoms-icon
                  flat
                  name="pencil"
                  :size="15"
                  @click="
                    () => {
                      $local.detail = $local.dataDetail?.find((__item) => __item.id == _item.id);
                      $local.amountDetail = _item.amount;
                    }
                  "
                ></atoms-icon>
                <atoms-icon
                  flat
                  name="close"
                  :size="20"
                  @click="
                    () => {
                      $model.details = $model.details?.filter((__item) => __item?.id !== _item.id);
                    }
                  "
                ></atoms-icon>
              </div>
            </div>
          </n-card>
          <br />
        </div>
        <n-card v-else class="col-span-full">
          <atoms-empty image="" span message=" ">
            <div class="flex flex-wrap items-center justify-center gap-2 text-center">
              <atoms-text>Please add minimum one detail</atoms-text>
            </div>
          </atoms-empty>
        </n-card>
      </section>

      <!-- policies -->
      <br />
      <section>
        <n-divider title-placement="left" class="col-span-full">
          <atoms-text span>Room's Policies</atoms-text>
        </n-divider>
        <section class="grid grid-cols-1 md:grid-cols-2 md:gap-x-5">
          <!-- @search="(_payload) => {

            }" -->
          <atoms-select
            class="col-span-2 lg:col-span-1"
            label="Select Policy"
            :options="
              $local.dataPolicies?.map((_policy) => ({
                label: _policy?.title,
                value: _policy,
              })) || []
            "
            v-model:value="$local.policy"
            :disabled="$local.mainLoading"
            clearable
          />

          <atoms-input
            :disabled="$local.mainLoading"
            class="col-span-2 lg:col-span-1"
            v-model:value="$local.policyDetails"
            label="Details"
            clearable
          />

          <n-button
            type="primary"
            class="col-span-full"
            :disabled="$local.mainLoading"
            @click="
              () => {
                if (!$local.policyDetails || !$local.policy) {
                  $createError(new $window.Error('Please fill policy and describe detail'));
                  return;
                }

                const _body = {
                  ...($local.policy || {}),
                  title: $local.policy?.title,
                  details: $local.policyDetails,
                };

                if ($findArrByCustom($model.policies, _body.title)) {
                  $model.policies = $model.policies?.filter(
                    (_item) => _item.title?.toLowerCase() != _body.title?.toLowerCase()
                  );
                }
                $model.policies = [...new Set([...($model.policies || []), _body])];
                $local.policyDetails = null;
                $local.policy = null;
              }
            "
            >Add Policy</n-button
          >
          <br />
        </section>
        <section>
          <section v-if="$model.policies?.length > 0" class="space-y-2 col-span-full">
            <n-card v-for="(_item, _iitem) in $model.policies" :key="_iitem" size="small">
              <div class="grid grid-cols-2">
                <div class="col-span-1">
                  <atoms-text strong class="capitalize"
                    >{{ _item.title }} ({{ _item?.category }})</atoms-text
                  >
                  <atoms-text caption>Category : {{ _item.details }}</atoms-text>
                </div>
                <div class="flex justify-end col-span-1 gap-2">
                  <atoms-icon
                    flat
                    name="close"
                    :disabled="$local.mainLoading"
                    :size="20"
                    @click="$model.policies = $model.policies?.filter((_it) => _it.id !== _item.id)"
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
              message="None of Package's Policies were added"
            ></atoms-empty>
            <br />
          </section>
        </section>
      </section>
      <br />
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
      <div
        v-if="$model.pictures?.length > 0"
        class="flex gap-5 p-2 mt-5 overflow-x-auto bg-white-smoke dark:bg-black"
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
          <n-text v-if="!_file.blob?.contentType?.includes('image')" class="">{{
            _file.blob?.contentType?.split("/")?.[1]?.toUpperCase()?.substring(0, 20) || "-"
          }}</n-text>
          <div
            class="flex absolute top-0 left-0 flex-col justify-start min-w-[250px] min-h-[150px] bg-black bg-opacity-50 p-2"
          >
            <div class="flex items-center justify-between">
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
                    ($model.pictures = $model.pictures?.filter((__file) => __file?.id != _file.id))
                "
              />
            </div>
            <atoms-text :link="_file.source || _file.picture" class="mt-auto !text-white">
              {{ _file.name || _file.title }}</atoms-text
            >
          </div>
        </div>
      </div>
      <n-card v-else>
        <atoms-empty image="" span message=" ">
          <div class="flex flex-wrap items-center justify-center gap-2 text-center">
            <atoms-text>(Minimum 1) You can upload pictures for your room type by open</atoms-text>
            <atoms-text @click="$local.openImageEditor = true">Picture Uploader.</atoms-text>
          </div>
        </atoms-empty>
      </n-card>
      <br />
      <br />
      <n-button attr-type="submit" type="primary" class="w-full" :disabled="$local.mainLoading"
        >Save Room Type</n-button
      >
    </n-form>

    <br />
    <br />
  </atoms-container>
</template>
