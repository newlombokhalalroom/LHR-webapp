<script setup>
import {
  NDescriptions,
  NDescriptionsItem,
  NDropdown,
  NCard,
  NDivider,
  NButtonGroup,
  NSkeleton,
  NButton,
  NTag,
  NPagination,
  NScrollbar,
  NStatistic,
  NNumberAnimation,
  NSpace,
  useNotification,
  useLoadingBar,
} from "naive-ui";
import moment from "moment";
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/store/user";
import { useClientStore } from "@/store/client";

const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);
const $clientStore = useClientStore();

const { $greeting } = useNuxtApp();
const $loadingBar = useLoadingBar();
const $notification = useNotification();
const route = useRoute();
const router = useRouter();
const $breakpoint = useBreakpoint();
const { $createError } = useError();

const $local = reactive({
  toggleStatusClient: false,
  mainLoading: false,
  data: null,
  raw: null,
  page: 1,
  limit: 5,
});

const $approveClient = async (id) => {
  ///clients/
  $loadingBar.start();
  $local.mainLoading = true;
  try {
    await $clientStore.put(`approve/${id}`);
    $notification.success({
      title: "Success",
      content: "Client was successfully updated",
    });
  } catch (error) {
    $createError(error);
  } finally {
    $loadingBar.finish();
    $local.mainLoading = false;
  }
};

const $onFetchClients = async (_payload) => {
  $loadingBar.start();
  $local.mainLoading = true;
  try {
    $local.page = _payload?.page || 1;
    const _page = $local.page;
    const _limit = _payload?.limit || 5;

    let _filter = {};
    if (_payload?.term || $local.term) {
      _filter.where = `${_filter.where || ""} OR name iLIKE '%${_payload?.term || $local.term}%''`;
    }

    const _resp = _payload?.unapproved
      ? await $clientStore.get("unapproved")
      : await $clientStore.get(null, {
          params: {
            filter: JSON.stringify(_filter),
            page: _page,
            limit: _limit,
          },
        });

    $local.data = _payload?.unapproved ? _resp?.result?.clients : _resp?.result;
    $local.raw = _resp;

    if (
      !$local.data?.find(
        (_item) => _item?.clientLocation?.latitude && _item?.clientLocation?.longitude
      )
    ) {
      const latitude = "-8.5869286",
        longitude = "116.0910654";
      $local.data[0].clientLocation = {
        latitude,
        longitude,
        ...((await $getGeolocation(latitude, longitude)) || {}),
      };
    }
  } catch (error) {
    $createError(error);
  } finally {
    $loadingBar.finish();
    $local.mainLoading = false;
  }
};

onMounted(() => {
  $onFetchClients();
});

definePageMeta({
  order: 3,
  label: "Clients",
  title: "Clients",
  navigator: ({ _user }) => {
    if (!_user?.scope?.includes("super-admin")) return false;
    return true;
  },
  validation: ({ _user }) => {
    if (!_user?.scope?.includes("super-admin")) return "/";
  },
});
</script>
<template>
  <atoms-container>
    <section id="quick" class="flex flex-col gap-5 md:flex-row">
      <atoms-input
        id="search-room"
        :disabled="$local.mainLoading"
        class="w-full md:w-auto md:grow"
        placeholder="Search by client name..."
        @keyup.enter="$onFetchMain({ page: 1 })"
        v-model:value="$local.term"
        hide-detail
      >
        <template #append
          ><n-button
            type="primary"
            :disabled="$local.mainLoading"
            @click="$onFetchClients({ page: 1 })"
          >
            Search
          </n-button>
          <n-button
            @click="
              () => {
                $local.term = null;
                $onFetchClients({ page: 1 });
              }
            "
            type="error"
            :disabled="$local.mainLoading"
            ><template #icon
              ><atoms-icon name="close" :circle="false" class="!text-white" /></template></n-button
        ></template>
      </atoms-input>
    </section>
    <br />
    <section>
      <n-button-group>
        <n-button
          @click="
            () => {
              $local.toggleStatusClient = !$local.toggleStatusClient;
              $onFetchClients({ unapproved: $local.toggleStatusClient });
            }
          "
          id="status-room"
          :disabled="$local.mainLoading"
        >
          Toggle By Client Approval
        </n-button>
        <n-button @click="router.push('/super-admin/clients/submit')">Add new type</n-button>
      </n-button-group>
    </section>
    <br />
    <section v-if="$local.mainLoading">
      <n-skeleton height="150px"></n-skeleton>
    </section>
    <section v-else class="space-y-5">
      <n-card v-for="(_item, _iitem) in $local.data" :key="_iitem">
        <template #header>
          <atoms-heading h5>{{ _item?.name || "@hotel_name" }}</atoms-heading>
        </template>
        <template #header-extra>
          <n-dropdown
            trigger="click"
            :options="[
              {
                key: 'approve-btn',
                label: 'Approve Client',
                props: {
                  onClick: () => $approveClient(_item?.id),
                },
              },
              {
                key: 'reject-btn',
                label: 'Reject Client',
                disabled: true,
              },
            ]"
            @select="handleSelect"
          >
            <n-button>Opsi</n-button>
          </n-dropdown>
        </template>
        <n-descriptions label-placement="top" :column="3">
          <n-descriptions-item label="Tipe">
            <atoms-text>
              {{ _item?.title || "-" }}
            </atoms-text>
          </n-descriptions-item>
          <n-descriptions-item label="Email">
            <atoms-text>
              {{ _item?.email || "-" }}
            </atoms-text>
          </n-descriptions-item>
          <n-descriptions-item label="No.Telp">
            <atoms-text>
              {{ _item?.phone || "-" }}
            </atoms-text>
          </n-descriptions-item>
          <n-descriptions-item label="NPWP">
            <atoms-text>
              {{ _item?.npwp || "-" }}
            </atoms-text>
          </n-descriptions-item>
          <n-descriptions-item label="Tanggal dibuat">
            <atoms-text>
              {{ _item?._created_date || "-" }}
            </atoms-text>
          </n-descriptions-item>
          <n-descriptions-item label="Tanggal diperbarui">
            <atoms-text>
              {{ _item?._created_date || "-" }}
            </atoms-text>
          </n-descriptions-item>
          <n-descriptions-item label="Pemilik">
            <atoms-text>
              {{ _item?.owner_id || "-" }}
            </atoms-text>
          </n-descriptions-item>
          <n-descriptions-item label="Approved by" span="2">
            <atoms-text>
              {{ _item?.approved_by || "-" }}
            </atoms-text>
          </n-descriptions-item>
          <n-descriptions-item
            v-if="_item?.clientLocation?.address && _item?.clientLocation?.city"
            label="Kota/Alamat"
            span="3"
          >
            <n-space>
              <atoms-text>
                {{ _item?.clientLocation?.city || "-" }} /{{
                  _item?.clientLocation?.address || "-"
                }}
              </atoms-text>
              <n-button
                :disabled="!_item?.clientLocation?.latitude"
                @click="
                  () => {
                    $window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${_item?.clientLocation?.latitude},${_item?.clientLocation?.longitude}`,
                      '_blank'
                    );
                  }
                "
                type="primary"
                size="small"
                icon-placement="right"
                >Lihat dengan peta<template #icon
                  ><atoms-icon flat name="arrow-top-right"></atoms-icon></template
              ></n-button>
            </n-space>
          </n-descriptions-item>
          <n-descriptions-item label="Deskripsi" span="3">
            <atoms-text>
              {{ _item?.description || "-" }}
            </atoms-text>
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
      <n-pagination
        v-if="!$local.toggleStatusClient"
        class="flex flex-wrap gap-y-5"
        v-model:page="$local.page"
        :page-count="$local.raw?.pages || 1"
        @update:page="
          (_val) => {
            $onFetchClients({
              page: _val,
            });
          }
        "
      />
    </section>
  </atoms-container>
</template>
