<script setup>
import {
  NForm,
  NFormItem,
  NInput,
  NModal,
  NButton,
  NTag,
  NDivider,
  NSkeleton,
  useNotification,
  useMessage,
  NScrollbar,
  NCard,
  useLoadingBar,
} from "naive-ui";
import * as uuid from "uuid";
import useApi from "@/composables/useApi";
import { useVuelidate } from "@vuelidate/core";
import { required, email, minValue, requiredIf, helpers } from "@vuelidate/validators";
import { useAmenitiesStore } from "@/store/amenities";
import { useDetailStore } from "@/store/detail";
import { useProductStore } from "@/store/product";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";
import moment from "moment";

const $detailStore = useDetailStore();
const { data: $dataDetail } = storeToRefs($detailStore);
const $amenitiesStore = useAmenitiesStore();
const { data: $dataAmenities } = storeToRefs($amenitiesStore);
const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);
const $productStore = useProductStore();

const router = useRouter();
const route = useRoute();
const { $api } = useApi();
const { $createError } = useErrorHandler();
const { $removeSeparator, $addSeparator, $uploadFile, $debounce, $window } = useNuxtApp();
const $breakpoint = useBreakpoint();
const $loadingBar = useLoadingBar();
const $notification = useNotification();
const $message = useMessage();
const $accept = "image/png, image/jpeg, image/jpg, image/gif";
const $uploadAttachment = ref(null);
const $local = reactive({
  mainLoading: false,
  openImageEditor: false,

  dataHalalService: null,
  termHalalService: null,

  dataInclusion: null,
  termInclusion: null,

  dataExclusion: null,
  termExclusion: null,

  dataPolicies: null,
  termPolicies: null,
  policy: null,
  policyDetails: null,

  dataAmenities: null,
  dataDetail: null,

  days: null,
  nights: null,
  update: null,
});

const $classified = {
  Halal: "halal",
  Regular: "regular",
  Excluded: "excluded",
  Days: "Days",
  Nights: "Nights",
};

const $model = reactive({
  title: null,
  units: null,
  amenities: null,
  policies: null,
  price: null,
  details: null,
  description: null,
  pictures: null,
  // UPDATE US-03 - KISUL
  // Trip Detail dengan default value 'Open trip'
  trip_detail: {
    trip_type: "Open trip",
  },
  itineraries: [],
  schedules: [],
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
    price: {
      minValue: minValue(1),
      required,
    },
    description: {
      required,
    },
    halal: {
      custom: helpers.withMessage(
        () => `Required minimum of 1 service`,
        (_value) => $filterArrByCustom($model.amenities, $classified.Halal)?.length > 0 || false
      ),
    },
    inclusion: {
      custom: helpers.withMessage(
        () => `Required minimum of 1 inclusion`,
        (_value) => $filterArrByCustom($model.amenities, $classified.Regular)?.length > 0 || false
      ),
    },
    exclusion: {
      custom: helpers.withMessage(
        () => `Required minimum of 1 exclusion`,
        (_value) => $filterArrByCustom($model.amenities, $classified.Excluded)?.length > 0 || false
      ),
    },
    days: {
      custom: helpers.withMessage(
        () => `Required days`,
        (_value) => $findArrByCustom($model.details, $classified.Days)?.amount > 0 || false
      ),
    },
    nights: {
      custom: helpers.withMessage(
        () => `Required nights`,
        (_value) => $findArrByCustom($model.details, $classified.Nights)?.amount > 0 || false
      ),
    },
    // policies: {
    //   required,
    // },
    schedules: {
      custom: helpers.withMessage(
        () => `Required minimum of 1 schedule for Open trip`,
        (_value) => $model.trip_detail.trip_type !== 'Open trip' || $model.schedules?.length > 0
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

// amenities
const $onFetchAmenities = async (_payload) => {
  let _resp = null;
  $local.mainLoading = true;
  try {
    _resp = await $amenitiesStore.get(null, {
      params: {
        ...(_payload || {}),
        type: $userStore.getClientType,
      },
    });
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
    return _resp;
  }
};

const $onFetchHalalService = async () => {
  $local.mainLoading = true;
  try {
    const _resp = await $onFetchAmenities({
      filter: JSON.stringify({
        where: $local.termHalalService
          ? `amenities.title iLike '%${$local.termHalalService}%'`
          : `1=1`,
      }),
      category: $classified.Halal,
    });
    if (_resp?.status) {
      $local.dataHalalService = _resp?.result;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onFetchInclusion = async () => {
  $local.mainLoading = true;
  try {
    const _resp = await $onFetchAmenities({
      filter: JSON.stringify({
        where: $local.termInclusion ? `amenities.title iLike '%${$local.termInclusion}%'` : `1=1`,
      }),
      category: $classified.Regular,
    });
    if (_resp?.status) {
      $local.dataInclusion = _resp?.result;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onFetchExclusion = async () => {
  $local.mainLoading = true;
  try {
    const _resp = await $onFetchAmenities({
      filter: JSON.stringify({
        where: $local.termExclusion ? `amenities.title iLike '%${$local.termExclusion}%'` : `1=1`,
      }),
      category: $classified.Excluded,
    });
    if (_resp?.status) {
      $local.dataExclusion = _resp?.result;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

// Add new amenity logic
const $addAmenityModal = reactive({
  show: false,
  saving: false,
  title: '',
  category: '',
});

const $openAddAmenity = (category) => {
  $addAmenityModal.title = '';
  $addAmenityModal.category = category;
  $addAmenityModal.show = true;
};

const $onAddAmenitySubmit = async () => {
  if (!$addAmenityModal.title) return $message.warning("Please enter a title");
  $addAmenityModal.saving = true;
  try {
    const payload = {
      title: $addAmenityModal.title,
      category: $addAmenityModal.category,
      type: $userStore.getClientType,
    };
    const res = await $api.post("/super-admin/amenities", payload);
    if (res?.status) {
      $message.success("Successfully added!");
      $addAmenityModal.show = false;
      
      const newAmenity = res.result?.amenity || payload;
      if ($addAmenityModal.category === $classified.Halal) {
        await $onFetchHalalService();
        const added = $local.dataHalalService?.find(a => a.title === newAmenity.title);
        if (added) $model.amenities = [...($model.amenities || []), added];
      } else if ($addAmenityModal.category === $classified.Regular) {
        await $onFetchInclusion();
        const added = $local.dataInclusion?.find(a => a.title === newAmenity.title);
        if (added) $model.amenities = [...($model.amenities || []), added];
      } else if ($addAmenityModal.category === $classified.Excluded) {
        await $onFetchExclusion();
        const added = $local.dataExclusion?.find(a => a.title === newAmenity.title);
        if (added) $model.amenities = [...($model.amenities || []), added];
      }
    }
  } catch (error) {
    $createError(error);
  } finally {
    $addAmenityModal.saving = false;
  }
};

// policies
const $onFetchPolicies = async (_payload) => {
  $local.mainLoading = true;
  try {
    const _resp = await $api.get(
      `policies?type=${$userStore.getClientType}&category=${$classified.Regular}`
    );
    // console.log(_resp);
    if (_resp?.status) {
      $local.dataPolicies = _resp?.result?.policies || _resp?.result;
    }
  } catch (error) {
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
        type: $userStore.getClientType?.toLowerCase(),
      },
    });
    if (_resp?.status) {
      $local.dataDetail = _resp.result;
    }
    // console.log(_resp);
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onReset = async () => {
  $form.value.$reset();
  Object.keys($model).forEach((_target) => {
    if (_target === 'trip_detail') {
      $model[_target] = { trip_type: "Open trip" };
    } else if (_target === 'itineraries') {
      $model[_target] = [];
    } else {
      $model[_target] = null;
    }
  });
  $model.itineraries = [];
  $model.schedules = [];
  await $onResetDetails();
};

const $onResetDetails = async () => {
  await $onFetchDetail();
  await $onFetchHalalService();
  await $onFetchInclusion();
  await $onFetchExclusion();
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

    const _body = Object.assign(
      {},
      {
        ...$model,
        id,
        availability: $model.availability || true,
        units: "package",
        pictures: _pictures,
      }
    );

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

      // US-03 Mengelola Data Paket Wisata & US-04 Mengelola Jadwal & Kuota (Open Trip) - proses pemanggilan apipost product
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
      content: `Your package (${_body.title}) was successfully saved`,
    });

    // $onReset();
    router.push({ path: `/admin/${$userStore.getClientTypeApp}/packages` });
  } catch (error) {
    console.error("Submit Error:", error);
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

watch(
  () => $local.mainLoading,
  (_val) => {
    if (_val) $loadingBar.start();
    else setTimeout(() => $loadingBar.finish(), 500);
  }
);

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
        // UPDATE US-03 - KISUL
        $model.trip_detail = _resp?.result?.trip_detail || { trip_type: 'Open trip' };
        $model.itineraries = _resp?.result?.itineraries || [];
        $model.schedules = (_resp?.result?.schedules || []).map((sch) => ({
          ...sch,
          departure_date: sch.departure_date ? moment(sch.departure_date).format("YYYY-MM-DD") : null,
          return_date: sch.return_date ? moment(sch.return_date).format("YYYY-MM-DD") : null,
        }));
        $local.update = _resp.result;
      } else {
        throw new Error("Failed to get package");
      }

      $local.days = $findArrByCustom(_resp?.result?.details, $classified.Days)?.amount;
      $local.nights = $findArrByCustom(_resp?.result?.details, $classified.Nights)?.amount;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
});

definePageMeta({
  title: "Submit Package",
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
    <div class="flex items-center gap-4">
      <n-button quaternary circle @click="router.back()">
        <template #icon><atoms-icon name="arrow-left" /></template>
      </n-button>
      <atoms-heading h2>{{ route.params.id ? "Update" : "Add" }} Package</atoms-heading>
    </div>
    <br />
    <n-form id="submit-main-form" @submit.prevent="$onSubmit">
      <section class="grid grid-cols-1 md:grid-cols-2 md:gap-x-5">
        <atoms-input
          :disabled="$local.mainLoading"
          class="col-span-2 lg:col-span-1"
          placeholder="Type your package name"
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
        <!-- <atoms-input
          :disabled="$local.mainLoading"
          label="Description"
          class="col-span-full"
          placeholder="Describe your package"
          :isError="$form.description.$error"
          :errors="$form.description.$errors"
          v-model:value="$model.description"
          type="textarea"
          clearable
          required
        /> -->
        <atoms-form
          class="col-span-full"
          :isError="$form.description.$error"
          :errors="$form.description.$errors"
        >
          <client-only>
            <molecules-rich-text-editor
              hide-attachments
              title="Description"
              class="col-span-full"
              :value="$model.description"
              base-path="products/descriptions"
              :base-id="$userStore.getClientTypeApp"
              :disabled="$local.mainLoading"
              @update="(_val) => ($model.description = _val)"
            />
          </client-only>
        </atoms-form>

        <!-- Package Duration -->
        <n-divider title-placement="left" class="col-span-full">
          <atoms-text span>Package Duration</atoms-text>
        </n-divider>
        <atoms-input-number
          :disabled="$local.mainLoading"
          class="col-span-2 lg:col-span-1"
          v-model:value="$local.days"
          label="Within (Days)"
          :isError="$form.days.$error"
          :errors="$form.days.$errors"
          @update:value="
            () => {
              const _target = $findArrByCustom($local.dataDetail, $classified.Days);
              const _body = {
                // type: $userStore.getClientType?.toLowerCase(),
                // detail_categories: 'Package Duration',
                id: _target?.id,
                title: _target?.title,
                amount: $local.days,
              };
              if ($findArrByCustom($model.details, $classified.Days)) {
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
          v-model:value="$local.nights"
          label="Into (Nights)"
          :isError="$form.nights.$error"
          :errors="$form.nights.$errors"
          @update:value="
            () => {
              const _target = $findArrByCustom($local.dataDetail, $classified.Nights);
              const _body = {
                // type: $userStore.getClientType?.toLowerCase(),
                // detail_categories: 'Package Duration',
                id: _target?.id,
                title: _target?.title,
                amount: $local.nights,
              };
              if ($findArrByCustom($model.details, $classified.Nights)) {
                $model.details = $model.details?.filter((_item) => _item.id != _target?.id);
              }
              $model.details = [...new Set([...($model.details || []), _body])];
            }
          "
          :min="1"
          clearable
          required
        />
      </section>

      <!-- Trip Details & Itineraries -->
      <section>
        <n-divider title-placement="left" class="col-span-full">
          <atoms-text span>Trip Details & Itineraries</atoms-text>
        </n-divider>
        <div class="grid grid-cols-1 md:grid-cols-2 md:gap-x-5 mb-5">
          <!-- Pemilihan Jenis Trip -->
          <atoms-select
            class="col-span-2 lg:col-span-1"
            label="Trip Type"
            :options="[
              { label: 'Open trip', value: 'Open trip' },
              { label: 'Private trip', value: 'Private trip' }
            ]"
            v-model:value="$model.trip_detail.trip_type"
            :disabled="$local.mainLoading"
            required
          />
        </div>
        
        <div class="col-span-full space-y-4">
          <div class="flex items-center justify-between">
            <atoms-text strong>Itineraries</atoms-text>
            <n-button 
              type="primary" 
              size="small" 
              @click="$model.itineraries.push({ day: 1, time: '', activity: '', description: '' })"
              :disabled="$local.mainLoading"
            >
              + Add Schedule
            </n-button>
          </div>
          
          <div v-if="$model.itineraries?.length === 0" class="text-center p-4 bg-gray-50 rounded-md dark:bg-black-smoke">
            <atoms-text caption>No itineraries added yet.</atoms-text>
          </div>
          
          <n-card v-for="(it, index) in $model.itineraries" :key="index" size="small" class="mb-4 bg-white/50 dark:bg-black-smoke">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="col-span-1">
                <atoms-input-number v-model:value="it.day" label="Day" :min="1" required />
              </div>
              <div class="col-span-1">
                <atoms-input v-model:value="it.time" label="Time (e.g. 08:00 - 10:00)" placeholder="08:00 - 10:00" required />
              </div>
              <div class="col-span-2">
                <atoms-input v-model:value="it.activity" label="Activity" placeholder="Go to beach" required />
              </div>
              <div class="col-span-3">
                <atoms-input v-model:value="it.description" label="Description" placeholder="Detail description..." type="textarea" />
              </div>
              <div class="col-span-1 flex items-end justify-end">
                <n-button type="error" @click="$model.itineraries.splice(index, 1)">Remove</n-button>
              </div>
            </div>
          </n-card>
        </div>
      </section>

      <!-- US-04 Mengelola Jadwal & Kuota (Open Trip) - form pengisian schedule atau jadwal open trip nya-->
      <!-- Open Trip Schedules -->
      <section v-if="$model.trip_detail.trip_type === 'Open trip'">
        <n-divider title-placement="left" class="col-span-full">
          <atoms-text span>Open Trip Schedules & Quotas</atoms-text>
        </n-divider>
        
        <div class="col-span-full space-y-4">
          <div class="flex items-center justify-between">
            <atoms-text caption>Add dates and available seats for this public trip.</atoms-text>
            <n-button 
              type="primary" 
              size="small" 
              @click="$model.schedules.push({ departure_date: null, return_date: null, total_quota: 10 })"
              :disabled="$local.mainLoading"
            >
              + Add Date Range
            </n-button>
          </div>

          <div v-if="$model.schedules?.length === 0" class="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg dark:border-gray-700">
            <atoms-text caption class="!text-red-500" v-if="$form.schedules.$error">
              {{ $form.schedules.$errors[0].$message }}
            </atoms-text>
            <atoms-text caption v-else>No schedules added yet. Required for Open Trip.</atoms-text>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <n-card v-for="(sch, index) in $model.schedules" :key="index" size="small" class="bg-primary/5 border-primary/20">
              <template #header>
                <div class="flex justify-between items-center w-full">
                  <atoms-text strong>Schedule #{{ index + 1 }}</atoms-text>
                  <n-button type="error" text @click="$model.schedules.splice(index, 1)">
                    <atoms-icon name="close" :size="18" />
                  </n-button>
                </div>
              </template>
              
              <div class="space-y-3">
                <atoms-input-date 
                  v-model:formatted-value="sch.departure_date" 
                  value-format="yyyy-MM-dd"
                  type="date"
                  label="Departure Date" 
                  required 
                />
                <atoms-input-date 
                  v-model:formatted-value="sch.return_date" 
                  value-format="yyyy-MM-dd"
                  type="date"
                  label="Return Date" 
                  required 
                />
                <atoms-input-number 
                  v-model:value="sch.total_quota" 
                  label="Total Quota (Seats)" 
                  :min="1" 
                  required 
                />
              </div>
            </n-card>
          </div>
        </div>
      </section>

      <!-- halal service -->
      <section>
        <n-divider title-placement="left" class="col-span-full">
          <div class="flex items-center gap-3">
            <atoms-text span>Halal Service</atoms-text>
            <n-button size="small" type="primary" @click="$openAddAmenity($classified.Halal)">+ Add New</n-button>
          </div>
        </n-divider>
        <atoms-input
          :disabled="$local.mainLoading"
          class="col-span-2 lg:col-span-1"
          placeholder="Search by service's name..."
          v-model:value="$local.termHalalService"
          required
        >
          <template #append>
            <n-button
              type="error"
              @click="
                () => {
                  $local.termHalalService = null;
                  $onFetchHalalService();
                }
              "
              >Reset</n-button
            >
            <n-button type="primary" @click="$onFetchHalalService">Search</n-button>
          </template>
        </atoms-input>
        <section>
          <div v-if="$local.dataHalalService?.length > 0" class="col-span-full space-y-2">
            <n-scrollbar x-scrollable trigger="none">
              <atoms-form :isError="$form.halal.$error" :errors="$form.halal.$errors" required>
                <div class="flex gap-x-5">
                  <n-card
                    v-for="(_amenities, _iamenities) in $local.dataHalalService"
                    :key="_iamenities"
                    size="small"
                    :class="[
                      'w-[10rem]  hover:shadow-md !cursor-pointer',
                      $model.amenities?.find((_it) => _it.id == _amenities.id) ? 'bg-primary' : '',
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
                    </div>
                  </n-card>
                </div>
              </atoms-form>
            </n-scrollbar>
          </div>
          <n-skeleton v-else type="card" height="100px" class="col-span-full w-full mb-5" />
        </section>
        <section>
          <section
            v-if="$filterArrByCustom($model.amenities, $classified.Halal)?.length > 0"
            class="col-span-full space-y-2"
          >
            <n-card
              v-for="(_item, _iitem) in $filterArrByCustom($model.amenities, $classified.Halal)"
              :key="_iitem"
              size="small"
            >
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
              message="None of Halal Service were added"
            ></atoms-empty>
            <br />
          </section>
        </section>
      </section>

      <!-- inclusion -->
      <section>
        <n-divider title-placement="left" class="col-span-full">
          <div class="flex items-center gap-3">
            <atoms-text span>Tour Inclusion</atoms-text>
            <n-button size="small" type="primary" @click="$openAddAmenity($classified.Regular)">+ Add New</n-button>
          </div>
        </n-divider>
        <atoms-input
          :disabled="$local.mainLoading"
          class="col-span-2 lg:col-span-1"
          placeholder="Search by incluion's name..."
          v-model:value="$local.termInclusion"
          required
        >
          <template #append>
            <n-button
              type="error"
              @click="
                () => {
                  $local.termInclusion = null;
                  $onFetchInclusion();
                }
              "
              >Reset</n-button
            >
            <n-button type="primary" @click="$onFetchInclusion">Search</n-button>
          </template>
        </atoms-input>
        <section>
          <div v-if="$local.dataInclusion?.length > 0" class="col-span-full space-y-2">
            <n-scrollbar x-scrollable trigger="none">
              <atoms-form
                :isError="$form.inclusion.$error"
                :errors="$form.inclusion.$errors"
                required
              >
                <div class="flex gap-x-5">
                  <n-card
                    v-for="(_amenities, _iamenities) in $local.dataInclusion"
                    :key="_iamenities"
                    size="small"
                    :class="[
                      'w-[10rem]  hover:shadow-md !cursor-pointer',
                      $model.amenities?.find((_it) => _it.id == _amenities.id) ? 'bg-primary' : '',
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
                    </div>
                  </n-card>
                </div>
              </atoms-form>
            </n-scrollbar>
          </div>
          <n-skeleton v-else type="card" height="100px" class="col-span-full w-full mb-5" />
        </section>
        <section>
          <section
            v-if="$filterArrByCustom($model.amenities, $classified.Regular)?.length > 0"
            class="col-span-full space-y-2"
          >
            <n-card
              v-for="(_item, _iitem) in $filterArrByCustom($model.amenities, $classified.Regular)"
              :key="_iitem"
              size="small"
            >
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
              message="None of Tour Inclusion were added"
            ></atoms-empty>
            <br />
          </section>
        </section>
      </section>

      <!-- exclusion -->
      <section>
        <n-divider title-placement="left" class="col-span-full">
          <div class="flex items-center gap-3">
            <atoms-text span>Tour Exclusion</atoms-text>
            <n-button size="small" type="primary" @click="$openAddAmenity($classified.Excluded)">+ Add New</n-button>
          </div>
        </n-divider>
        <atoms-input
          :disabled="$local.mainLoading"
          class="col-span-2 lg:col-span-1"
          placeholder="Search by exclusion's name..."
          v-model:value="$local.termExclusion"
          required
        >
          <template #append>
            <n-button
              type="error"
              @click="
                () => {
                  $local.termExclusion = null;
                  $onFetchExclusion();
                }
              "
              >Reset</n-button
            >
            <n-button type="primary" @click="$onFetchExclusion">Search</n-button>
          </template>
        </atoms-input>
        <section>
          <div v-if="$local.dataExclusion?.length > 0" class="col-span-full space-y-2">
            <n-scrollbar x-scrollable trigger="none">
              <atoms-form
                :isError="$form.exclusion.$error"
                :errors="$form.exclusion.$errors"
                required
              >
                <div class="flex gap-x-5">
                  <n-card
                    v-for="(_amenities, _iamenities) in $local.dataExclusion"
                    :key="_iamenities"
                    size="small"
                    :class="[
                      'w-[10rem]  hover:shadow-md !cursor-pointer',
                      $model.amenities?.find((_it) => _it.id == _amenities.id) ? 'bg-primary' : '',
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
                    </div>
                  </n-card>
                </div>
              </atoms-form>
            </n-scrollbar>
          </div>
          <n-skeleton v-else type="card" height="100px" class="col-span-full w-full mb-5" />
        </section>
        <section>
          <section
            v-if="$filterArrByCustom($model.amenities, $classified.Excluded)?.length > 0"
            class="col-span-full space-y-2"
          >
            <n-card
              v-for="(_item, _iitem) in $filterArrByCustom($model.amenities, $classified.Excluded)"
              :key="_iitem"
              size="small"
            >
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
              message="None of Tour Exclusion were added"
            ></atoms-empty>
            <br />
          </section>
        </section>
      </section>

      <!-- policies -->
      <section>
        <n-divider title-placement="left" class="col-span-full">
          <atoms-text span>Package's Policies</atoms-text>
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
                  title: $local.policy?.title,
                  details: $local.policyDetails,
                };

                if ($findArrByCustom($model.policies, _body.title)) {
                  $model.policies = $model.policies?.filter(
                    (_item) => _item.title?.toLowerCase() != _body.title?.toLowerCase()
                  );
                }
                $model.policies = [...new Set([...($model.policies || []), _body])];
              }
            "
            >Add Policy</n-button
          >
          <br />
        </section>
        <section>
          <section
            v-if="$model.policies?.length > 0"
            class="col-span-full space-y-2"
          >
            <n-card
              v-for="(_item, _iitem) in $model.policies"
              :key="_iitem"
              size="small"
            >
              <div class="grid grid-cols-2">
                <div class="col-span-1">
                  <atoms-text strong class="capitalize">{{ _item.title }}</atoms-text>
                  <atoms-text caption>{{ _item.details }}</atoms-text>
                </div>
                <div class="col-span-1 flex justify-end gap-2">
                  <atoms-icon
                    flat
                    name="close"
                    :disabled="$local.mainLoading"
                    :size="20"
                    @click="$model.policies = $model.policies?.filter((_it) => _it.title !== _item.title)"
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

      <!-- pictures -->
      <section>
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
            <n-text v-if="!_file.blob?.contentType?.includes('image')" class="">{{
              _file.blob?.contentType?.split("/")?.[1]?.toUpperCase()?.substring(0, 20) || "-"
            }}</n-text>
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
            <atoms-text>(Minimum 1) You can upload pictures for your package by open</atoms-text>
            <atoms-text @click="$local.openImageEditor = true">Picture Uploader.</atoms-text>
          </div>
        </atoms-empty>
      </section>
      <br />
      <n-button attr-type="submit" type="primary" class="w-full" :disabled="$local.mainLoading"
        >Save Package</n-button
      >
    </n-form>

    <br />
    <br />

    <!-- Modal Add Amenity -->
    <n-modal v-model:show="$addAmenityModal.show" preset="dialog" title="Add New Facility">
      <n-form label-placement="top">
        <n-form-item label="Title">
          <n-input v-model:value="$addAmenityModal.title" placeholder="e.g. Free Wifi, Makan Siang" />
        </n-form-item>
        <n-form-item label="Category">
          <n-input :value="$addAmenityModal.category.toUpperCase()" disabled />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="$addAmenityModal.show = false">Cancel</n-button>
        <n-button type="primary" class="ml-2" :loading="$addAmenityModal.saving" @click="$onAddAmenitySubmit">
          Add
        </n-button>
      </template>
    </n-modal>
  </atoms-container>
</template>
