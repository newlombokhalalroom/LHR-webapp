<script setup>
import {
  NDropdown,
  NCard,
  NDivider,
  NSkeleton,
  NButton,
  NTag,
  NPagination,
  NScrollbar,
  NSpace,
  NStatistic,
  NNumberAnimation,
  useNotification,
  useLoadingBar,
} from "naive-ui";
import { useUserStore } from "@/store/user";
import { useProductStore } from "@/store/product";
import { useClientStore } from "@/store/client";
import { storeToRefs } from "pinia";
import moment from "moment";

const $productStore = useProductStore();

const $clientStore = useClientStore();
const { data: $dataClient } = storeToRefs($clientStore);

const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);

const route = useRoute();
const router = useRouter();
const $loadingBar = useLoadingBar();
const $notification = useNotification();
const { $addSeparator } = useNuxtApp();
const { $createError } = useError();
const $breakpoint = useBreakpoint();
const $local = reactive({
  term: null,
  mainLoading: false,
  openFilter: false,
  roomName: null,

  data: null,
  raw: null,
  page: 1,
  limit: 5,
});

const $onFetchMain = async (_payload) => {
  $local.mainLoading = true;
  try {
    $local.page = _payload?.page || 1;
    const _limit = _payload?.limit || $local.limit;
    const _page = $local.page;

    const _resp = await $productStore.get(`unavailable/${$dataUser.value?.client?.id}`, {
      params: {
        filter: JSON.stringify({
          where: $local.term ? `product_items.title iLIKE '%${$local.term.toLowerCase()}%'` : "1=1",
          order: `product_items._created_date DESC`,
        }),
        page: _page,
        limit: _limit,
      },
    });

    if (_resp?.status) {
      $local.data = _resp.result;
      $local.raw = _resp;
    }
  } catch (error) {
    $local.data = null;
    $local.raw = null;
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

watch(
  () => $local.mainLoading,
  (value) => {
    if (value) {
      $loadingBar.start();
    } else {
      $loadingBar.finish();
      window.scrollTo({ top: 0 });
    }
  }
);

onMounted(() => {
  $onFetchMain();
});

definePageMeta({
  order: 5,
  label: "Availability",
  navigator: ({ _user }) => {
    if (!_user?.scope?.includes("admin") || !_user?.client?.type?.includes("hotel")) return false;
    return true;
  },
  validation: ({ _user }) => {
    if (!_user?.scope?.includes("admin")) return "/";
    if (!_user?.client?.type?.toLowerCase().includes("hotel")) return "/";
  },
});
</script>
<template>
  <div>
    <molecules-drawer
      v-model:show="$local.openFilter"
      :content="{
        title: 'Availibility Filter',
      }"
      @mounted="
        () => {
          return reactive({
            startDate: null,
            endDate: null,
          });
        }
      "
      @closed="
        (payload) => {
          if (payload) {
            $onFetchMain({
              where: `(unavailable_status.start_date >= '${new Date(
                payload?.startDate
              ).toISOString()}' AND unavailable_status.end_date <= '${new Date(
                payload?.endDate
              ).toISOString()}')`,
            });
          }

          $local.openFilter = false;
        }
      "
    >
      <template v-slot="{ data: $data, onClose: $onClose }">
        <div>
          <atoms-input-date
            type="date"
            :is-date-disabled="(ts) => ts < $dateHours(new Date(), 0)"
            v-model:value="$data.startDate"
            label="Start Date"
            format="dd MMMM yyyy"
            placeholder="Select Start Date"
          />

          <atoms-input-date
            type="date"
            :is-date-disabled="(ts) => ts < $dateHours($data.startDate, 0)"
            v-model:value="$data.endDate"
            label="End Date"
            format="dd MMMM yyyy"
            placeholder="Select End Date"
          />

          <n-button
            type="primary"
            :disabled="!$data.startDate || !$data.endDate"
            @click="
              $onClose({
                startDate: new Date(new Date($data.startDate).setHours(0)),
                endDate: new Date(new Date($data.endDate).setHours(23, 59, 59)),
              })
            "
            >Save</n-button
          >

          {{ $data }}
        </div>
      </template>
    </molecules-drawer>
    <atoms-container>
      <br />
      <n-card :title="`${moment($dateHours()).format('dddd, DD MMMM YYYY')}`">
        <template #header-extra>
          <atoms-icon name="refresh" @click="$onFetchMain()"></atoms-icon>
        </template>
        <div class="grid md:grid-cols-3">
          <n-statistic label="Available">
            <div>
              <n-number-animation
                ref="$countAnimationInstRef"
                show-separator
                :from="0"
                :to="$local.raw?.total || 0"
                :active="true"
              />
            </div>
          </n-statistic>
          <n-statistic label="Unavailable">
            <div>
              <n-number-animation
                ref="$countAnimationInstRef"
                show-separator
                :from="0"
                :to="$local.raw?.count || 0"
                :active="true"
              />
            </div>
          </n-statistic></div
      ></n-card>
      <br />
      <div id="quick" class="flex flex-col gap-2 md:flex-row">
        <n-button
          @click="router.push({ path: '/admin/hotel/availibility/submit' })"
          id="status-room"
          class="md:w-auto md:grow-0"
          :disabled="$local.mainLoading"
          type="primary"
        >
          Set Status
        </n-button>
        <n-button
          @click="$local.openFilter = true"
          id="status-room"
          class="md:w-auto md:grow-0"
          :disabled="true || $local.mainLoading"
        >
          Add Filter</n-button
        >
        <atoms-input
          id="search-room"
          :disabled="$local.mainLoading"
          class="w-full md:w-auto md:grow"
          placeholder="Search room by name..."
          @keyup.enter="$onFetchMain({ page: 1 })"
          v-model:value="$local.term"
          hide-detail
        >
          <template #append>
            <div class="flex">
              <n-button
                type="primary"
                :round="false"
                class="!rounded-none"
                :disabled="$local.mainLoading"
                @click="
                  () => {
                    $onFetchMain({ page: 1 });
                  }
                "
              >
                Search
              </n-button>

              <atoms-icon
                :disabled="$local.mainLoading"
                name="close"
                :circle="false"
                class="!rounded-l-none"
                @click="
                  () => {
                    $local.term = null;
                    $onFetchMain({ page: 1 });
                  }
                "
              />
            </div>
          </template>
        </atoms-input>
      </div>
      <br />
      <section v-if="$local.mainLoading && !$local.data" class="space-y-5">
        <n-skeleton card height="150px" :repeat="5"></n-skeleton>
      </section>
      <section v-else-if="$local.data?.length > 0" class="space-y-5">
        <n-divider title-placement="left" class="!mt-0">
          <atoms-text span
            >Showing {{ $local.data?.length }} from {{ $local.raw.count || 0 }} data</atoms-text
          >
        </n-divider>
        <n-card
          v-for="(_room, _iroom) in $local.data"
          :key="_iroom"
          size="small"
          :title="_room.title"
        >
          <template #header>
            <atoms-heading h5
              >Room {{ _room?.product_item?.title?.replaceAll("Room", "") }}</atoms-heading
            >
            <atoms-text span>as {{ _room?.product?.title }}</atoms-text>
          </template>
          <!-- <template #header-extra>
            <n-dropdown
              trigger="click"
              :options="[
                {
                  key: 0,
                  label: 'Edit Room Type',
                  props: {
                    onClick: () => router.push({ path: '/admin/hotel/room/submit/' + _room.id }),
                  },
                },
              ]"
            >
              <atoms-icon flat :size="20" name="dots-vertical" />
            </n-dropdown>
          </template> -->
          <n-divider class="!mt-0 !mb-2" />
          <section class="grid md:grid-cols-3">
            <div class="">
              <atoms-text caption strong class="!text-primary">From (date): </atoms-text>
              <atoms-text caption>{{ moment(_room.start_date).format("DD MMMM YYYY") }}</atoms-text>
            </div>
            <div class="">
              <atoms-text caption strong class="!text-primary">Until (date): </atoms-text>
              <atoms-text caption>{{ moment(_room.end_date).format("DD MMMM YYYY") }}</atoms-text>
            </div>
            <div class="">
              <atoms-text caption strong class="!text-primary">Span (length): </atoms-text>
              <atoms-text caption
                >{{
                  Math.abs(moment(_room.start_date).diff(moment(_room.end_date), "days"))
                }}
                day</atoms-text
              >
            </div>
            <div class="">
              <atoms-text caption strong class="!text-primary"
                >Used in (order):
                <atoms-text v-if="_room?.orders?.length > 0" caption href="#" class="!inline"
                  >See All <atoms-icon flat name="arrow-top-right" /></atoms-text
              ></atoms-text>
              <atoms-text v-if="_room?.orders?.length > 0" caption
                >[{{ _room?.orders?.map((_item) => _item.id).toString() }}]</atoms-text
              >
              <atoms-text v-else caption>None (manually created)</atoms-text>
            </div>
          </section>
        </n-card>
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
      <section v-else>
        <atoms-empty />
      </section>
      <br />
    </atoms-container>
  </div>
</template>
