<script setup>
import {
  NSkeleton,
  NCard,
  NTag,
  NButton,
  NAlert,
  useNotification,
  useLoadingBar,
  NSpace,
  NTabs,
  NDivider,
  NTabPane,
  NScrollbar,
} from "naive-ui";
import { v4 } from "uuid";
import useApi from "@/composables/useApi";
import { useVuelidate } from "@vuelidate/core";
import { required, email, minValue } from "@vuelidate/validators";
import moment from "moment/min/moment-with-locales";
moment.locale("id");

import { useUserStore } from "@/store/user";
import { useClientStore } from "@/store/client";
import { storeToRefs } from "pinia";

const $userStore = useUserStore();
const $clientStore = useClientStore();
const { data: $dataUser } = storeToRefs($userStore);

const { $api } = useApi();
const {
  $trim,
  $uploadFile,
  $window,
  $getGeolocationByTerm,
  $getGeolocation,
  $provinceType,
  $cityTypes,
} = useNuxtApp();
const { $createError } = useCustomError();
const $breakpoint = useBreakpoint();
const $loadingBar = useLoadingBar();
const router = useRouter();
const $notification = useNotification();
const $local = reactive({
  mainLoading: false,
  openImageEditor: false,
  openProfilePictureEditor: false,
  facilities: null,
  titlePolicy: null,
  categoryPolicy: null,
  descriptionPolicy: null,
  policies: null,
  data: null,
  tab: null,
});

const $location = reactive({
  term: null,
  list: null,
  target: null, // [{ latitude: -8.5869073, longitude: 116.0921869 }],
  address: null,
  province: null,
  city: null,
});
///orders/{id}/confirmation/{status}
const $form = useVuelidate(
  {
    target: {
      required,
    },
    address: {
      required,
    },
    province: {
      required,
    },
    city: {
      required,
    },
  },
  $location,
);

const $onFetchMain = async (_body, _path = null) => {
  $local.mainLoading = true;
  try {
    ///clients/${route.params.slug}
    const _resp = await $clientStore.get(`${$dataUser.value?.client?.id}`, _body);
    if (_resp.status) {
      $local.data = _resp?.result;
    }

    if ($local.data?.clientLocation?.latitude && $local.data?.clientLocation?.longitude) {
      $location.target = await $getGeolocation(
        $local.data?.clientLocation?.latitude,
        $local.data?.clientLocation?.longitude,
      );
      $location.address = $local.data?.clientLocation?.address;
      $location.province = $local.data?.clientLocation?.province;
      $location.city = $local.data?.clientLocation?.city;
    }

    if (!Array.isArray($location.target)) {
      $location.target = [Object.assign({}, $location.target)];
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onFetchAnotherFacilities = async (_payload) => {
  $local.mainLoading = true;
  try {
    const _resp = await $api.get("facilities");
    if (_resp?.status) {
      $local.facilities = _resp?.result?.facilities || _resp?.result;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onFetchAnotherPolicies = async () => {
  $local.policiesLoading = true;
  try {
    // ambil type dari store; fallback ke data user; jadikan lower-case & trim
    const rawType = $userStore.getClientType || $dataUser.value?.client?.type || "";
    const type = String(rawType).trim().toLowerCase();

    // panggilan utama: hanya pakai "type" (jangan batasi category biar opsi tidak hilang)
    let _resp = await $api.get(type ? `policies?type=${encodeURIComponent(type)}` : `policies`);

    // fallback jika API mengembalikan kosong/aneh
    if (!_resp?.status) {
      _resp = await $api.get(`policies`);
    }

    // normalisasi berbagai bentuk payload API
    const pickList = (r) => r?.result?.policies ?? r?.result?.data ?? r?.result ?? r?.data ?? r;

    const list = pickList(_resp);
    $local.policies = Array.isArray(list) ? list : Array.isArray(list?.rows) ? list.rows : [];
  } catch (error) {
    $local.policies = []; // jangan biarkan NULL agar UI bisa tampil state "empty"
    $createError(error);
  } finally {
    $local.policiesLoading = false;
  }
};

const $onInsert = async (_body, _path = null, message = true) => {
  let _result = null;
  $local.mainLoading = true;
  try {
    _result = await $clientStore.post(_path, _body);
    // todo:force update
    await $userStore.refresh();
    await $onFetchMain();
    if (message) {
      $notification.success({
        title: "Status",
        content: "Data successfully added",
      });
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
    return _result;
  }
};

const $onUpdate = async (_body, _path = null, message = true) => {
  let _result = null;
  $local.mainLoading = true;
  try {
    _result = await $clientStore.put(_path, _body);
    // todo:force update
    await $userStore.refresh();
    await $onFetchMain();
    if (message) {
      $notification.success({
        title: "Status",
        content: "Data successfully updated",
      });
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
    return _result;
  }
};

const $uploadProfilePicture = async (_payload) => {
  $local.mainLoading = true;
  try {
    const _picture = await $uploadFile(
      _payload.rawSource,
      `clients/${$dataUser.value?.client?.id}`,
      `picture-${new Date().getTime()}${v4()}`,
    );

    await $onUpdate({
      picture: _picture,
    });
  } finally {
    $local.mainLoading = false;
  }
};

const $uploadPictures = async (_payload) => {
  $local.mainLoading = true;
  try {
    if (_payload?.length > 0) {
      _payload = await Promise.all(
        _payload?.map(async (_item) => ({
          url: await $uploadFile(
            _item.rawSource,
            `clients/${$dataUser.value?.client?.id}`,
            `picture-${new Date().getTime()}${v4()}`,
          ),
          title: $dataUser.value?.client?.name,
          description: "Picture of " + $dataUser.value?.client?.name,
        })),
      );

      await Promise.all(
        _payload?.map(async (_item) => {
          await $onInsert(_item, "pictures", false);
          return _item;
        }),
      ).then(() => {
        $notification.success({
          title: "Status",
          content: "Pictures successfully added",
        });
      });
    }
  } finally {
    $local.mainLoading = false;
  }
};

const $onDelete = async (_body, _path = null) => {
  $local.mainLoading = true;

  try {
    await $clientStore.delete(_path, {
      data: _body,
    });
    // todo:force update
    await $userStore.refresh();
    await $onFetchMain();
    $notification.success({
      title: "Status",
      content: "Data successfully deleted",
    });
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onSearchAddress = async (_payload) => {
  $local.mainLoading = true;
  try {
    if (!$location.list) $location.list = [];

    const _result = await $getGeolocationByTerm(_payload);

    $location.list = _result?.map((_item) => ({
      label: _item.display_name,
      value: {
        latitude: _item.lat,
        longitude: _item.lon,
        display_name: _item.display_name,
      },
    }));
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onLocateMe = async () => {
  $local.mainLoading = true;
  try {
    const $userLocation = await useGeolocation();

    if ($userLocation) $location.target = [$userLocation];
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onSubmitLocation = async () => {
  $local.mainLoading = true;
  try {
    if (!(await $form.value.$validate())) {
      $notification.warning({
        title: "Validation",
        content: "Please make sure all fields are filled",
      });
      return;
    }
    const _body = {
      address: $location.address?.slice(0, 99),
      latitude: Number($location.target?.[0]?.latitude || $location.target?.[0]?.lat),
      longitude: Number($location.target?.[0]?.longitude || $location.target?.[0]?.lon),
      province: $location.province,
      city: $location.city,
    };

    if (!$local.data?.clientLocation) {
      await $onInsert(_body, "locations");
    } else {
      await $onUpdate(_body, "locations");
    }

    $notification.success({
      title: "Success",
      content: `Your location was successfully saved`,
    });
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

watch(
  () => $local.tab,
  () => {
    $onFetchMain();
    if ($local.tab == String(0)) {
      $onFetchAnotherFacilities();
      $onFetchAnotherPolicies();
    }
  },
);

watch(
  () => $location.target,
  (_val) => {
    if ($location.target?.[0]?.display_name) {
      $location.address = $location.target?.[0]?.display_name;
      // $location.province = _val?.[0]?.address?.state;
      // $location.city = _val?.[0]?.address?.citys;
    }
  },
);

watch(
  () => $local.mainLoading,
  (_val) => {
    if (_val) $loadingBar.start();
    else setTimeout(() => $loadingBar.finish(), 500);
  },
);

onMounted(() => {
  $local.tab = String(0);
});

definePageMeta({
  order: 1,
  label: "Company Profile",
  navigator: ({ _user }) => {
    if (!_user?.scope?.includes("admin") || !_user?.client?.type?.includes("hotel")) return false;
    return true;
  },
  validation: ({ _user }) => {
    if (!_user?.scope?.includes("admin") || !_user?.client?.type?.includes("hotel")) return "/";
  },
});
</script>
<template>
  <div>
    <molecules-modal
      title="Profile Picture Uploader"
      v-model:show="$local.openProfilePictureEditor"
      :style="{
        width: $breakpoint.mdAndDown ? '90%' : '600px',
      }"
      @closed="
        (_val) => {
          if (_val?.[0]) {
            $uploadProfilePicture(_val?.[0]);
            // $model.pictures = [...($model.pictures || []), ...(_val || [])];
          }
          $local.openProfilePictureEditor = false;
        }
      "
    >
      <molecules-image-editor
        :camera="{
          disabled: true,
        }"
        :max="1"
      />
    </molecules-modal>
    <molecules-modal
      title="Pictures Uploader"
      v-model:show="$local.openImageEditor"
      :style="{
        width: $breakpoint.mdAndDown ? '90%' : '600px',
      }"
      @closed="
        (_val) => {
          if (_val?.[0]) {
            $uploadPictures(_val);
          }
          $local.openImageEditor = false;
        }
      "
    >
      <molecules-image-editor
        :camera="{
          disabled: true,
        }"
        :max="5"
      />
    </molecules-modal>
    <Head
      ><Title>{{ $dataUser?.client?.name }}</Title></Head
    >
    <atoms-image-native
      v-if="$local.data?.clientPictures?.[0]?.picture"
      :src="$local.data?.clientPictures?.[0]?.picture"
      height="250px"
    >
      <template #none
        ><n-space
          class="w-full h-full bg-white-smoke dark:bg-black-pure"
          justify="center"
          align="center"
        >
          <atoms-icon flat size="25" name="camera" class="!text-primary" /></n-space
      ></template>
      <section class="grid w-full h-full grid-cols-2">
        <div></div>
        <div class="grid grid-cols-2 overflow-hidden">
          <atoms-image-native :src="$local.data?.clientPictures?.[1]?.picture">
            <template #none
              ><n-space
                class="w-full h-full bg-white-smoke dark:bg-black-pure"
                justify="center"
                align="center"
              >
                <atoms-icon
                  flat
                  size="25"
                  name="camera"
                  class="!text-primary" /></n-space></template
          ></atoms-image-native>
          <atoms-image-native :src="$local.data?.clientPictures?.[2]?.picture">
            <template #none
              ><n-space
                class="w-full h-full bg-white-smoke dark:bg-black-pure"
                justify="center"
                align="center"
              >
                <atoms-icon
                  flat
                  size="25"
                  name="camera"
                  class="!text-primary" /></n-space></template
          ></atoms-image-native>
          <atoms-image-native :src="$local.data?.clientPictures?.[3]?.picture">
            <template #none
              ><n-space
                class="w-full h-full bg-white-smoke dark:bg-black-pure"
                justify="center"
                align="center"
              >
                <atoms-icon
                  flat
                  size="25"
                  name="camera"
                  class="!text-primary" /></n-space></template
          ></atoms-image-native>
          <atoms-image-native :src="$local.data?.clientPictures?.[4]?.picture">
            <template #none
              ><n-space
                class="w-full h-full bg-white-smoke dark:bg-black-pure"
                justify="center"
                align="center"
              >
                <atoms-icon
                  flat
                  size="25"
                  name="camera"
                  class="!text-primary" /></n-space></template
          ></atoms-image-native>
        </div>
      </section>
    </atoms-image-native>
    <div v-else class="h-[250px] bg-primary-darken relative top-0 left-0"></div>

    <n-skeleton v-if="!$dataUser?.client?.id" :repeat="2"></n-skeleton>
    <atoms-container v-else>
      <n-button
        type="primary"
        @click="router.push({ path: '/admin/hotel' })"
        class="-translate-y-28 !text-white"
        >Main Page</n-button
      >
      <n-card class="mx-auto -translate-y-24">
        <div v-if="!$dataUser?.client?.id" class="space-y-2">
          <n-skeleton :repeat="2"></n-skeleton>
          <n-skeleton :repeat="2" width="50%"></n-skeleton>
        </div>
        <div v-else class="flex gap-5 space-y-2">
          <div class="ring-5 ring-primary relative group" style="width: 150px; height: 150px">
            <atoms-avatar
              ref="$refPicture"
              class="cursor-pointer dark:!bg-black bg-white"
              :src="$dataUser?.client?.picture"
              sizes="150"
              nickname="account"
            />
            <div
              class="absolute inset-0 flex flex-col items-center justify-center w-full h-full gap-2 bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <n-button size="tiny" type="primary" @click="$local.openProfilePictureEditor = true"
                >Update Picture</n-button
              >
            </div>
          </div>
          <div>
            <Head>
              <Title>{{ $dataUser?.client?.name }}</Title>
            </Head>
            <atoms-editable-text
              :value="$dataUser?.client?.name"
              @submit="
                (payload) => {
                  if (payload) {
                    $onUpdate({
                      name: $trim(payload),
                    });
                  }
                }
              "
            >
              <template #text
                ><atoms-heading class="capitalize">
                  {{ $dataUser?.client?.name }}
                </atoms-heading></template
              >
            </atoms-editable-text>
            <atoms-text class="mt-1"
              >Joined {{ moment($data?.client?._created_date).format("DD MMMM YYYY") }}</atoms-text
            >
            <br />
            <n-space>
              <!-- <n-tag size="small" type="primary"> Halal Certified </n-tag> -->
              <n-tag size="small"> Hotel </n-tag></n-space
            >
          </div>
        </div>
      </n-card>

      <n-tabs v-model:value="$local.tab" type="segment" class="-translate-y-20">
        <n-tab-pane name="0" tab="Overview">
          <n-card>
            <section class="space-y-2">
              <div>
                <atoms-text span strong class="!text-primary">Description</atoms-text>

                <atoms-editable-text
                  :value="$dataUser?.client?.description"
                  @submit="
                    (payload) => {
                      if (payload) {
                        $onUpdate({
                          description: $trim(payload),
                        });
                      }
                    }
                  "
                >
                  <template #text
                    ><atoms-text>{{ $dataUser?.client?.description }}...</atoms-text>
                  </template>
                </atoms-editable-text>
              </div>

              <div>
                <atoms-text span strong class="!text-primary">Contact</atoms-text>
                <div class="flex items-center gap-2">
                  <atoms-text caption strong>Email : </atoms-text>
                  <atoms-text>{{ $dataUser?.client?.email }}</atoms-text>
                </div>
                <div class="flex items-center gap-2">
                  <atoms-text caption strong>Phone : </atoms-text>
                  <atoms-editable-text
                    maska="(+##) ###-####-#####"
                    :value="$dataUser?.client?.phone"
                    @submit="
                      (payload) => {
                        if (payload) {
                          $onUpdate({
                            phone: $trim(payload),
                          });
                        }
                      }
                    "
                  >
                    <template #text
                      ><atoms-text>{{ $dataUser?.client?.phone }}</atoms-text>
                    </template>
                  </atoms-editable-text>
                </div>
                <div class="flex items-center gap-2">
                  <atoms-text caption strong>NPWP : </atoms-text>
                  <atoms-editable-text
                    maska="##.###.###.#-###.###"
                    :value="$dataUser?.client?.npwp"
                    @submit="
                      (payload) => {
                        if (payload) {
                          $onUpdate({
                            npwp: $trim(payload),
                          });
                        }
                      }
                    "
                  >
                    <template #text
                      ><atoms-text>{{ $dataUser?.client?.npwp }}</atoms-text>
                    </template>
                  </atoms-editable-text>
                </div>
              </div>
            </section>
          </n-card>
          <n-divider title-placement="left">
            <div class="flex gap-2">
              <atoms-text span>Facilities</atoms-text>
            </div>
          </n-divider>
          <section>
            <div>
              <div
                v-if="$local.facilities?.length > 0 && !$local.mainLoading"
                class="space-y-2 col-span-full"
              >
                <n-scrollbar x-scrollable>
                  <div class="flex gap-x-5">
                    <n-card
                      v-for="(_facility, _ifacility) in $local.facilities"
                      :key="_ifacility"
                      :disabled="$local.mainLoading"
                      :class="[
                        'w-[15rem] h-[7rem] hover:shadow-md !cursor-pointer',
                        $local.data?.clientFacilities?.find((_it) => _it.id == _facility.id)
                          ? 'bg-primary'
                          : '',
                      ]"
                      @click.stop="
                        () => {
                          if (
                            !$local.data?.clientFacilities?.find((_it) => _it.id == _facility.id)
                          ) {
                            $onInsert(
                              {
                                facilities: [_facility.title],
                              },
                              'facilities',
                            );
                          }
                        }
                      "
                    >
                      <div
                        class="flex flex-col items-center justify-center w-full h-full text-center"
                      >
                        <atoms-text caption strong class="!text-inherit !capitalize"
                          >({{ _facility.category }})</atoms-text
                        >
                        <atoms-text caption class="!text-inherit">{{ _facility.title }}</atoms-text>
                      </div>
                    </n-card>
                  </div>
                </n-scrollbar>
              </div>
              <n-skeleton v-else type="card" height="100px" class="w-full col-span-full" />
            </div>

            <br />
          </section>
          <section v-if="$local.data?.clientFacilities?.length > 0" class="space-y-2 col-span-full">
            <n-card
              v-for="(_item, _iitem) in $local.data.clientFacilities"
              :key="_iitem"
              size="small"
            >
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
                      () => {
                        if ($window.confirm('Are you sure? this cannot be undone')) {
                          $local.data.clientFacilities = $local.data.clientFacilities?.filter(
                            (__item) => __item?.id !== _item.id,
                          );

                          $onDelete(
                            {
                              facility: _item.title,
                            },
                            'facilities',
                          );
                        }
                      }
                    "
                  ></atoms-icon>
                </div>
              </div>
            </n-card>
            <br />
          </section>
          <section v-else>
            <atoms-empty image="" message="None of facilites were added" class="!h-5"></atoms-empty>
            <br />
          </section>

          <section>
            <n-divider title-placement="left">
              <atoms-text span>Policies</atoms-text>
            </n-divider>
            <!-- <section> -->
            <!-- <div class="grid grid-cols-2 col-span-full gap-x-5">
                <atoms-input
                  :disabled="$local.mainLoading"
                  class="col-span-full lg:col-span-1"
                  label="Title"
                  placeholder="Title Policy..."
                  v-model:value="$local.titlePolicy"
                  clearable
                  required
                />

                <atoms-select
                  class="col-span-full lg:col-span-1"
                  label="Category Policy"
                  :options="
                    ['halal', 'regular']?.map((_item) => ({
                      label: _item,
                      value: _item,
                    })) || []
                  "
                  v-model:value="$local.categoryPolicy"
                  :disabled="$local.mainLoading"
                  required
                  clearable
                />

                <atoms-input
                  :disabled="$local.mainLoading"
                  class="col-span-full"
                  label="Description"
                  type="textarea"
                  placeholder="Description Policy..."
                  v-model:value="$local.descriptionPolicy"
                  clearable
                  required
                />

                <div class="col-span-full">
                  <n-button
                    type="primary"
                    class="w-full md:w-auto"
                    @click="
                      () => {
                        if (
                          !$local.titlePolicy ||
                          !$local.categoryPolicy ||
                          !$local.descriptionPolicy
                        ) {
                          return $notification.warning({
                            title: 'Attention',
                            content: 'Please make sure policy fields were filled',
                          });
                        }

                        $onInsert(
                          {
                            policies: [
                              {
                                title: $local.titlePolicy,
                                // description: $local.descriptionPolicy,
                                details: $local.descriptionPolicy,
                                // category: $local.categoryPolicy,
                              },
                            ],
                          },
                          'policies'
                        );

                        $local.titlePolicy = null;
                        $local.categoryPolicy = null;
                        $local.descriptionPolicy = null;
                      }
                    "
                    >Add Policy</n-button
                  >
                </div>
              </div>
              <br /> -->
            <!-- </section> -->
            <section>
              <div>
                <div
                  v-if="$local.policies?.length > 0 && !$local.mainLoading"
                  class="space-y-2 col-span-full"
                >
                  <n-scrollbar x-scrollable>
                    <div class="flex gap-x-5">
                      <n-card
                        v-for="(_policy, _ipolicy) in $local.policies"
                        :key="_ipolicy"
                        :disabled="$local.mainLoading"
                        :class="[
                          'w-[15rem] h-[7rem] hover:shadow-md !cursor-pointer',
                          $local.data?.policies?.find((_it) => _it.policy_id == _policy.id)
                            ? 'bg-primary'
                            : '',
                        ]"
                        @click.stop="
                          () => {
                            if (
                              !$local.data?.policies?.find((_it) => _it.policy_id == _policy.id)
                            ) {
                              $onInsert(
                                {
                                  policies: [
                                    {
                                      title: _policy.title,
                                      details: _policy.description,
                                    },
                                  ],
                                },
                                'policies',
                              );
                            }
                          }
                        "
                      >
                        <div
                          class="flex flex-col items-center justify-center w-full h-full text-center"
                        >
                          <atoms-text caption strong class="!text-inherit !capitalize"
                            >({{ _policy.category }})</atoms-text
                          >
                          <atoms-text caption class="!text-inherit">{{ _policy.title }}</atoms-text>
                        </div>
                      </n-card>
                    </div>
                  </n-scrollbar>
                </div>
                <n-skeleton v-else type="card" height="100px" class="w-full col-span-full" />
              </div>

              <br />
            </section>
            <section v-if="$local.data?.policies?.length > 0" class="space-y-2 col-span-full">
              <n-card v-for="(_item, _iitem) in $local.data.policies" :key="_iitem" size="small">
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
                        () => {
                          if ($window.confirm('Are you sure? this cannot be undone')) {
                            $local.data.policies = $local.data.policies?.filter(
                              (__item) => __item?.policy_id !== _item.id,
                            );
                            $onDelete(null, `policies/${_item.policy_id}`);
                          }
                        }
                      "
                    ></atoms-icon>
                  </div>
                </div>
              </n-card>
              <br />
            </section>
            <atoms-empty v-else image="" message="None of policies were added"> </atoms-empty>
          </section>

          <n-divider title-placement="left">
            <div class="flex items-center gap-5">
              <atoms-text span>Pictures</atoms-text>
              <n-button
                size="small"
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
            v-if="$local.data?.clientPictures?.length > 0"
            class="flex gap-5 p-2 mt-5 overflow-x-auto bg-white-smoke dark:bg-black"
          >
            <div
              v-for="(_file, _ifile) in $local.data.clientPictures"
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
                      () => {
                        if ($window.confirm('Are you sure? this cannot be undone')) {
                          $onDelete(
                            {
                              id: _file.id,
                            },
                            `pictures`,
                          );
                        }
                      }
                    "
                  />
                  <!-- @click="
                  () =>
                    ($model.pictures = $model.pictures?.filter((__file) => __file?.id != _file.id))
                " -->
                </div>
                <atoms-text :link="_file.source || _file.picture" class="mt-auto !text-white">
                  {{ _file.name || _file.title }}</atoms-text
                >
              </div>
            </div>
          </div>
          <atoms-empty v-else image="" message="None of pictures were added"> </atoms-empty>
        </n-tab-pane>
        <n-tab-pane name="1" tab="Location">
          <br />

          <section class="grid gap-5 md:grid-cols-2">
            <div>
              <n-alert type="info"
                ><atoms-text span
                  >You can use textbox or click inside map area to pin point your bussiness
                  location</atoms-text
                ></n-alert
              >
              <br />
              <atoms-select
                label="Search By Location Name"
                placeholder="You can press `enter` to search"
                :options="$location.list || []"
                :value="$location.target?.[0]?.display_name || $location.term"
                @search.enter="(_val) => ($location.term = _val)"
                @keydown.enter="$onSearchAddress($location.term)"
                @update:value="(_val) => ($location.target = [_val])"
                :disabled="$local.mainLoading"
                :loading="$local.mainLoading"
                hide-detail
                filterable
                clearable
                remote
              >
                <template #prepend>
                  <n-button :disabled="$local.mainLoading" @click="$onLocateMe">Locate Me</n-button>
                </template>
                <template #append>
                  <n-button
                    :disabled="$local.mainLoading"
                    @click="$onSearchAddress($location.term)"
                    type="primary"
                    >Cari</n-button
                  >
                </template></atoms-select
              >
              <n-divider title-placement="left">
                <div class="flex gap-2">
                  <atoms-text span>With</atoms-text>
                </div>
              </n-divider>
              <atoms-input
                :disabled="$local.mainLoading"
                v-model:value="$location.address"
                label="Address"
                clearable
                required
              />
              <atoms-select
                :label="'Choose Province'"
                :disabled="$local.mainLoading"
                :options="$provinceType || []"
                v-model:value="$location.province"
              />
              <atoms-select
                :label="'Choose City'"
                :disabled="$local.mainLoading"
                :options="($location.province && $cityType?.[$location.province]) || []"
                v-model:value="$location.city"
              />
              <n-button
                class="w-full"
                type="primary"
                @click="$onSubmitLocation"
                :disabled="$local.mainLoading"
                >Save Location</n-button
              >
            </div>
            <molecules-map-embed
              clean
              radius
              class="md:sticky top-5 bg-primary w-full h-full !overflow-hidden"
              :locations="$location.target"
              @clicked="(payload) => ($location.target = [payload])"
            />
          </section>
        </n-tab-pane>
        <n-tab-pane name="2" tab="Reviews">
          <n-card>
            <atoms-empty message="There are no reviews at the moment..." image=""></atoms-empty>
          </n-card>
        </n-tab-pane>
      </n-tabs>
    </atoms-container>
  </div>
</template>
