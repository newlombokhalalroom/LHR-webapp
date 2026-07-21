<script setup>
import {
  NCard,
  NButton,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpace,
  useNotification,
  NDivider,
  NPopconfirm,
} from "naive-ui";
import { h } from "vue";
import { useUserStore } from "@/store/user";
import { usePartnerHotelStore } from "@/store/partnerHotel";
import { storeToRefs } from "pinia";
import moment from "moment";

const $partnerHotelStore = usePartnerHotelStore();
const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);

const $notification = useNotification();
const { $addSeparator } = useNuxtApp();
const { $createError } = useError();

const $local = reactive({
  mainLoading: false,
  submitLoading: false,
  showModal: false,
  isEdit: false,
  selectedId: null,
  data: [],
  form: {
    name: "",
    price_per_night: 0,
    address: "",
    description: "",
  },
});

const columns = [
  {
    title: "Hotel Name",
    key: "name",
    render(row) {
      return h("div", { class: "font-bold" }, row.name);
    },
  },
  {
    title: "Price/Night",
    key: "price_per_night",
    render(row) {
      return h("div", { class: "text-primary" }, `Rp ${$addSeparator(row.price_per_night)}`);
    },
  },
  {
    title: "Address",
    key: "address",
    width: 300,
  },
  {
    title: "Actions",
    key: "actions",
    render(row) {
      return h(NSpace, {}, {
        default: () => [
          h(
            NButton,
            {
              size: "small",
              type: "primary",
              onClick: () => $onEdit(row),
            },
            { default: () => "Edit" }
          ),
          h(
            NPopconfirm,
            {
              onPositiveClick: () => $onDelete(row.id),
            },
            {
              trigger: () => h(NButton, { size: "small", type: "error", ghost: true }, { default: () => "Delete" }),
              default: () => "Are you sure you want to delete this hotel?",
            }
          ),
        ],
      });
    },
  },
];

// US-05 Mengatur Data Hotel Partner dan Harga Hotel Partner - Pemanggilan api Get My Hotel Partner
const $onFetchMain = async () => {
  $local.mainLoading = true;
  try {
    const _resp = await $partnerHotelStore.getMyHotels();
    if (_resp?.status) {
      $local.data = _resp.result;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onOpenAdd = () => {
  $local.isEdit = false;
  $local.selectedId = null;
  $local.form = {
    name: "",
    price_per_night: 0,
    address: "",
    description: "",
  };
  $local.showModal = true;
};

const $onEdit = (row) => {
  $local.isEdit = true;
  $local.selectedId = row.id;
  $local.form = { ...row };
  $local.showModal = true;
};

// 3.	US-05 Mengatur Data Hotel Partner dan Harga Hotel Partner - Pemanggilan method untuk edit dan menyimpan data hotel partner
const $onSubmit = async () => {
  $local.submitLoading = true;
  try {
    let _resp;
    if ($local.isEdit) {
      _resp = await $partnerHotelStore.put($local.selectedId, $local.form);
    } else {
      _resp = await $partnerHotelStore.post(null, $local.form);
    }

    if (_resp?.status) {
      $notification.success({
        title: "Success",
        content: `Hotel ${$local.isEdit ? "updated" : "added"} successfully`,
      });
      $local.showModal = false;
      $onFetchMain();
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.submitLoading = false;
  }
};

const $onDelete = async (id) => {
  try {
    const _resp = await $partnerHotelStore.delete(id);
    if (_resp?.status) {
      $notification.success({
        title: "Deleted",
        content: "Hotel removed successfully",
      });
      $onFetchMain();
    }
  } catch (error) {
    $createError(error);
  }
};

onMounted(() => {
  $onFetchMain();
});

definePageMeta({
  order: 3,
  label: "Hotel Partner",
  navigator: ({ _user }) => {
    if (!_user?.scope?.includes("admin") || !_user?.client?.type?.toLowerCase()?.includes("tour")) return false;
    return true;
  },
  validation: ({ _user }) => {
    if (!_user?.scope?.includes("admin") || !_user?.client?.type?.toLowerCase()?.includes("tour")) return "/";
  },
});
</script>

<template>
  <div>
    <Head><Title>Partner Hotels</Title></Head>
    <atoms-container>
      <br />
      <div class="flex justify-between items-center mb-6">
        <div>
          <atoms-heading h2>Partner Hotels</atoms-heading>
          <atoms-text caption>Manage your hotel partners for include hotel options.</atoms-text>
        </div>
        <n-button type="primary" color="#10b981" @click="$onOpenAdd">
          <template #icon><atoms-icon name="plus" flat></atoms-icon></template>
          New Hotel
        </n-button>
      </div>

      <n-card>
        <n-data-table
          :loading="$local.mainLoading"
          :columns="columns"
          :data="$local.data"
          :bordered="false"
          remote
        />
      </n-card>

      <!-- Modal Form -->
      <n-modal
        v-model:show="$local.showModal"
        preset="card"
        :title="$local.isEdit ? 'Edit Partner Hotel' : 'Add New Partner Hotel'"
        class="w-full max-w-lg !bg-white dark:!bg-black"
      >
        <n-form :model="$local.form">
          <n-form-item label="Hotel Name">
            <n-input v-model:value="$local.form.name" placeholder="E.g. Sheraton Lombok" />
          </n-form-item>
          <n-form-item label="Price Per Night">
            <n-input-number
              v-model:value="$local.form.price_per_night"
              class="w-full"
              :min="0"
              placeholder="0"
            >
              <template #prefix>Rp</template>
            </n-input-number>
          </n-form-item>
          <n-form-item label="Address">
            <n-input
              type="textarea"
              v-model:value="$local.form.address"
              placeholder="Full address of the hotel"
            />
          </n-form-item>
          <n-form-item label="Description (Optional)">
            <n-input
              type="textarea"
              v-model:value="$local.form.description"
              placeholder="Short description or notes"
            />
          </n-form-item>
          
          <div class="mt-6 flex justify-end gap-3">
            <n-button @click="$local.showModal = false">Cancel</n-button>
            <n-button
              type="primary"
              color="#10b981"
              :loading="$local.submitLoading"
              @click="$onSubmit"
            >
              {{ $local.isEdit ? 'Update Hotel' : 'Save Hotel' }}
            </n-button>
          </div>
        </n-form>
      </n-modal>
    </atoms-container>
  </div>
</template>

<style scoped>
:deep(.n-data-table-th) {
  @apply !bg-white-smoke dark:!bg-black-pure;
}
</style>
