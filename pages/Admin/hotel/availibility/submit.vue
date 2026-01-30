<script setup>
import { useUserStore } from "@/store/user";
import { useClientStore } from "@/store/client";
import { useProductStore } from "@/store/product";
import { storeToRefs } from "pinia";

import {
  NSkeleton,
  NAlert,
  NCard,
  NDivider,
  NScrollbar,
  NSpace,
  NForm,
  NButton,
  NTag,
  useNotification,
  NButtonGroup,
} from "naive-ui";
import moment from "moment/min/moment-with-locales";
import { useVuelidate } from "@vuelidate/core";
import { required, email, minValue, helpers } from "@vuelidate/validators";
// moment.locale("id");

const $userStore = useUserStore();
const $productStore = useProductStore();
const $clientStore = useClientStore();
const { data: $dataUser } = storeToRefs($userStore);

const { $useDbStorage } = useStorage();
const $notification = useNotification();
const router = useRouter();
const { $api } = useApi();
const $onClose = inject("$onClose");
const { $createError } = useError();
const { $roles, $amongIncludes, $dateAddition, $dateEdit, $dateHours, $dateSubstract } =
  useNuxtApp();
const $props = defineProps({
  target: {
    type: Object,
    default: null,
  },
});

const $local = reactive({
  mainLoading: false,
  isDisabledAll: false,
});

const $model = reactive({
  overlaping: false,
  startDate: null,
  endDate: null,
  roomType: {
    term: null,
    selected: null,
    list: null,
  },
  room: {
    term: null,
    selected: null,
    list: null,
  },
});

const $form = useVuelidate(
  {
    startDate: {
      required,
      custom: helpers.withMessage(
        () => `Change date`,
        (_value) => !!$local.isDisabledAll || !_value || !$model.overlaping
      ),
    },
    endDate: {
      required,
      custom: helpers.withMessage(
        () => `End date cannot overlap start date`,
        (_value) =>
          !!$local.isDisabledAll ||
          !_value ||
          !(_value < $dateHours($model.startDate || new Date()))
      ),
    },
    room: {
      required,
      custom: helpers.withMessage(
        () => `Please select room`,
        (_value) => !!$local.isDisabledAll || !_value || $model.room?.selected?.id
      ),
    },
    roomType: {
      required,
      custom: helpers.withMessage(
        () => `Please select room type`,
        (_value) => !_value || $model.roomType?.selected?.id
      ),
    },
  },
  $model
);

const $listOfRoom = computed(() => {
  return (
    $model.room.list?.map((_room) => ({
      label: _room.title,
      value: _room,
    })) || []
  );
});

const $onFetchRoom = async () => {
  $local.mainLoading = true;
  try {
    const _resp = await $productStore.get(`${$model.roomType.selected?.id}/items`, {
      params: {
        filter: JSON.stringify({
          where: `title iLIKE ${`'%${$model.room.term?.toLowerCase() || ""}%'`}`,
        }),
      },
    });
    if (_resp?.status) {
      $model.room.list = _resp.result?.items;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onSelectedRoom = async (_payload) => {
  if (_payload) {
    $model.room.selected = _payload;
  }
};

const $listOfRoomType = computed(() => {
  return (
    $model.roomType.list?.map((_roomType) => ({
      label: _roomType.title,
      value: _roomType,
    })) || []
  );
});

const $onFetchRoomType = async () => {
  $local.mainLoading = true;
  try {
    const _resp = await $clientStore.get(`${$dataUser.value?.client?.id}/products`, {
      params: {
        filter: JSON.stringify({
          where: $model.roomType.term
            ? `title iLIKE ${`'%${$model.roomType.term.toLowerCase()}%'`}`
            : "1=1",
        }),
        limit: 5,
      },
    });
    if (_resp?.status) {
      $model.roomType.list = _resp.result;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onSelectedRoomType = async (_payload) => {
  if (_payload) {
    $model.roomType.selected = _payload;
    $onFetchRoom();
  }
};

const $onSubmit = async () => {
  //{productId}/items/{itemId}/unavailable
  $model.overlaping = false;
  $local.mainLoading = true;
  try {
    if (!(await $form.value.$validate()) && !$local.isDisabledAll) {
      throw new Error("Please check again");
    }

    if ($local.isDisabledAll && !$model.roomType?.selected?.id) {
      throw new Error("Please make sure you filled room type");
    }

    if (!$local.isDisabledAll) {
      const body = {
        startDate: new Date($dateHours($model.startDate, 12)),
        endDate: new Date($dateHours($model.endDate, 12)),
      };

      await $productStore.post(
        `${$model.roomType?.selected?.id}/items/${$model.room?.selected?.id}/unavailable`,
        body
      );

      $notification.success({
        title: "Success",
        content: `Your room (${$model.room?.selected?.title || "-"}) status has successfully saved`,
      });
    } else {
      delete $model.roomType?.selected?.items;
      delete $model.roomType?.selected?.client;
      delete $model.roomType?.selected?.client_id;
      delete $model.roomType?.selected?._created_date;
      delete $model.roomType?.selected?._updated_date;
      $model.roomType.selected.amenities = $model.roomType?.selected?.amenities?.map((_item) => ({
        id: _item?.id,
      }));
      $model.roomType.selected.pictures = $model.roomType?.selected?.pictures?.map((_item) => {
        delete _item?.id;
        return _item;
      });

      console.log($model.roomType.selected);
      await $productStore.patch(`${$model.roomType?.selected?.id}`, {
        ...($model.roomType?.selected || {}),
        id: $model.roomType?.selected?.id,
        availability: !$model.roomType?.selected?.availability || false,
      });
    }

    router.push({ path: "/admin/hotel/availibility" });
  } catch (error) {
    if (error?.data?.message?.includes("overlap")) {
      $model.overlaping = true;
    }
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

onMounted(() => {
  $onFetchRoomType();
});
</script>
<template>
  <atoms-container>
    <br />
    <atoms-heading h2>Set Availability</atoms-heading>
    <br />
    <n-alert type="info">
      <atoms-text>Fill the forms from the top order</atoms-text>
    </n-alert>
    <br />
    <n-form
      ref="$formInstance"
      @submit.prevent="$onSubmit"
      class="grid grid-cols-1 md:grid-cols-2 md:gap-x-5"
    >
      <atoms-select
        class="col-span-full"
        label="Select Room Type"
        placeholder="Hit `enter` to search"
        :options="$listOfRoomType"
        :value="$model.roomType.selected || $model.roomType.term"
        :loading="$local.mainLoading"
        @search.enter="(_val) => ($model.roomType.term = _val)"
        @keydown.enter="$onFetchRoomType"
        @update:value="$onSelectedRoomType"
        :isError="$form.roomType.$error"
        :errors="$form.roomType.$errors"
        @clear="
          () => {
            $model.roomType.term = null;
            $onFetchRoomType();
          }
        "
        filterable
        clearable
        remote
      >
        <template #append>
          <n-button :disabled="$local.mainLoading" @click="$onFetchRoomType" type="primary"
            >Find Room Type</n-button
          >
        </template></atoms-select
      >
      <n-button-group class="col-span-full">
        <n-button
          @click="$local.isDisabledAll = false"
          :type="!$local.isDisabledAll ? 'primary' : 'default'"
          >Selected Room Only</n-button
        >
        <n-button
          @click="$local.isDisabledAll = true"
          :type="$local.isDisabledAll ? 'primary' : 'default'"
          >{{ $model.roomType?.selected?.availability ? "Disabled" : "Enabled" }} All Room</n-button
        >
      </n-button-group>
      <br />
      <template v-if="!$local.isDisabledAll">
        <atoms-select
          class="col-span-full"
          label="Select Room"
          :disabled="!$model.roomType.selected"
          placeholder="Hit `enter` to search"
          :options="$listOfRoom"
          :value="$model.room.selected || $model.room.term"
          :loading="$local.mainLoading"
          @search.enter="(_val) => ($model.room.term = _val)"
          @keydown.enter="$onFetchRoom"
          @update:value="$onSelectedRoom"
          :isError="$form.room.$error"
          :errors="$form.room.$errors"
          @clear="
            () => {
              $model.room.term = null;
              $onFetchRoom();
            }
          "
          filterable
          clearable
          remote
        >
          <template #append>
            <n-button
              :disabled="$local.mainLoading || !$model.roomType.selected"
              @click="$onFetchRoom"
              type="primary"
              >Find Room</n-button
            >
          </template></atoms-select
        >

        <atoms-input-date
          type="date"
          class="col-span-2 md:col-span-1"
          :disabled="!$model.room.selected"
          :is-date-disabled="(ts) => ts < $dateHours(new Date(), 0)"
          v-model:value="$model.startDate"
          :isError="$form.startDate.$error"
          :errors="$form.startDate.$errors"
          label="Start Date"
          format="dd MMMM yyyy"
          placeholder="Select Start Date" />

        <atoms-input-date
          type="date"
          :disabled="!$model.room.selected"
          class="col-span-2 md:col-span-1"
          :is-date-disabled="(ts) => ts < $dateHours($model.startDate, 0)"
          v-model:value="$model.endDate"
          :isError="$form.endDate.$error"
          :errors="$form.endDate.$errors"
          label="End Date"
          format="dd MMMM yyyy"
          placeholder="Select End Date"
      /></template>
      <template v-else>
        <n-alert type="warning" class="col-span-full">
          <atoms-text
            >You will {{ $model.roomType?.selected?.availability ? "disabled" : "enabled" }} all
            room's availability</atoms-text
          >
        </n-alert>
      </template>
      <br />
      <n-button :disabled="$local.mainLoading" attr-type="submit" class="col-span-2" type="primary"
        >Save</n-button
      >
      <br />
    </n-form>
  </atoms-container>
</template>
