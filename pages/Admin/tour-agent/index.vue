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
  NStatistic,
  NNumberAnimation,
  NSpace,
  NGi,
  NGrid,
  useNotification,
} from "naive-ui";
import moment from "moment";
import { useClientStore } from "@/store/client";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";

const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);
const $clientStore = useClientStore();

const { $greeting } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const $breakpoint = useBreakpoint();
const { $createError } = useErrorHandler();
const { $api } = useApi();

const $local = reactive({
  mainLoading: false,
  data: null,
  raw: null,
  summaryLoading: false,
  summary: null,
});

const $onFetchMain = async (_payload) => {
  $local.mainLoading = true;
  try {
    const _resp = await $clientStore.get(`${$dataUser.value?.client?.id}/products`, {
      params: {
        filter: JSON.stringify({
          order: "products._created_date DESC",
        }),
        page: 1,
        limit: 5,
      },
    });
    if (_resp?.status) {
      $local.data = _resp.result;
      $local.raw = _resp;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onFetchSummary = async () => {
  $local.summaryLoading = true;
  try {
    const _resp = await $api.get("/orders/summaries", {
      params: { lastmonths: 0 },
    });
    if (_resp?.status) {
      $local.summary = _resp.result;
    }
  } catch (error) {
    console.error(error);
  } finally {
    $local.summaryLoading = false;
  }
};

onMounted(() => {
  $onFetchMain();
  $onFetchSummary();
});

definePageMeta({
  order: 0,
  label: "Dashboard",
  title: "Tour Dashboard",
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
    <atoms-container v-if="!$dataUser?.id">
      <br />
      <n-skeleton height="150px"></n-skeleton>
      <br />
    </atoms-container>
    <atoms-container v-else>
      <br />
      <section class="grid grid-cols-1 md:grid-cols-5 gap-10 md:items-center justify-center">
        <div class="col-span-full md:col-span-3 md:!justify-start">
          <div class="flex flex-col items-start">
            <atoms-text strong class="capitalize"> Hi {{ $dataUser?.username }} </atoms-text>
            <atoms-heading h2 class="capitalize">{{ $greeting() }}</atoms-heading>
          </div>
        </div>
      </section>

      <n-divider title-placement="left" class="!text-primary">
        <div class="flex items-center gap-2">
          <atoms-icon name="pin" flat class="rotate-45 !mb-0 !text-inherit"></atoms-icon>
          <atoms-text span class="!text-inherit">Shortcut</atoms-text>
        </div>
      </n-divider>

      <n-scrollbar x-scrollable>
        <div class="space-x-10 flex mb-5">
          <n-card
            v-for="(_shortcut, _ishortcut) in [
              {
                title: 'Packages',
                icon: 'package',
                href: '/admin/tour-agent/packages',
              },
              {
                title: 'Orders',
                icon: 'clipboard-text',
                href: '/admin/tour-agent/orders',
              },
              {
                title: 'Profile',
                icon: 'account-group',
                href: '/admin/tour-agent/profile',
              },
              {
                title: 'Settings',
                icon: 'cog',
                href: '/profil',
              },
            ]"
            :key="_ishortcut"
            class="w-[10rem] h-[10rem] hover:shadow-md !cursor-pointer"
            @click="
              () => {
                $router.push({ path: _shortcut.href });
              }
            "
          >
            <div class="flex flex-col items-center justify-center h-full w-full gap-5 pt-1">
              <atoms-icon class="!text-inherit" :name="_shortcut.icon" flat size="50"></atoms-icon>
              <atoms-text class="!text-inherit">{{ _shortcut.title }}</atoms-text>
            </div>
          </n-card>
        </div>
      </n-scrollbar>

      <!-- Order Summary Metrics -->
      <n-divider title-placement="left" class="!text-primary">
        <div class="flex items-center gap-2">
          <atoms-icon name="chart-bar" flat class="!mb-0 !text-inherit"></atoms-icon>
          <atoms-text span class="!text-inherit">Order Summary (All Time)</atoms-text>
        </div>
      </n-divider>
      <section v-if="$local.summaryLoading" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <n-skeleton height="80px" :repeat="4" />
      </section>
      <section v-else-if="$local.summary" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <n-card size="small" class="text-center">
          <n-statistic label="Total order">
            <n-number-animation :from="0" :to="$local.summary?.total || 0" />
          </n-statistic>
        </n-card>
        <n-card size="small" class="text-center">
          <n-statistic label="Completed">
            <template #prefix><span class="text-green-500">✓</span></template>
            <n-number-animation :from="0" :to="$local.summary?.done?.total || 0" />
          </n-statistic>
        </n-card>
        <n-card size="small" class="text-center">
          <n-statistic label="Declined">
            <template #prefix><span class="text-red-500">✗</span></template>
            <n-number-animation :from="0" :to="$local.summary?.cancelled?.total || 0" />
          </n-statistic>
        </n-card>
        <n-card size="small" class="text-center">
          <n-statistic label="Income">
            <template #prefix>IDR</template>
            <n-number-animation :from="0" :to="$local.summary?.income || 0" />
          </n-statistic>
        </n-card>
      </section>

      <n-divider title-placement="left" class="!text-primary">
        <div class="flex items-center gap-2">
          <atoms-icon name="package" flat class="rotate-45 !mb-0 !text-inherit"></atoms-icon>
          <atoms-text span class="!text-inherit">Current Packages</atoms-text>
        </div>
      </n-divider>
      <br />
      <section v-if="$local.mainLoading && !$local.data" class="space-y-5">
        <n-skeleton card height="150px" :repeat="5"></n-skeleton>
      </section>
      <section v-else-if="$local.data?.length > 0" class="space-y-5">
        <div
          v-for="(_product, _i_product) in $local.data"
          :key="_i_product"
          class="shadow-xl hover:shadow-sm rounded-md overflow-hidden cursor-pointer transition-all duration-300 ease-out bg-white dark:bg-black"
        >
          <section class="grid grid-cols-5">
            <atoms-image-native
              :src="_product.pictures?.[0]?.picture"
              class="col-span-full md:col-span-1 min-h-[200px]"
              ><template #none
                ><n-space
                  class="h-full bg-white-smoke dark:bg-black-pure w-full"
                  justify="center"
                  align="center"
                >
                  <atoms-icon
                    flat
                    size="25"
                    name="domain"
                    class="!text-primary" /></n-space></template
            ></atoms-image-native>
            <div
              class="col-span-full md:col-span-4 p-5"
              @click.stop="router.push({ path: `/admin/${$userStore.getClientTypeApp}/packages/${_product.id}` })"
            >
              <div class="grid grid-cols-2">
                <div class="col-span-1 flex flex-col h-full">
                  <div>
                    <atoms-heading h4>{{ _product.title }}</atoms-heading>
                  </div>
                </div>
                <div class="col-span-1 flex gap-2 flex-col justify-center items-end">
                  <n-dropdown
                    trigger="click"
                    :options="[
                      {
                        label: 'Edit Package',
                        key: 0,
                        props: {
                          onClick: () =>
                            router.push(
                              `/admin/${$userStore.getClientTypeApp}/packages/submit/${_product?.id}`
                            ),
                        },
                      },
                      {
                        label: 'Detail Package',
                        key: 1,
                        props: {
                          onClick: () =>
                            router.push(`/admin/${$userStore.getClientTypeApp}/packages/${_product.id}`),
                        },
                      },
                    ]"
                  >
                    <n-button size="small" secondary round type="primary">package detail</n-button>
                  </n-dropdown>
                </div>
              </div>
              <n-space class="mt-2">
                <n-tag size="small" type="primary" class="capitalize">
                  {{ _product.client?.title || "-" }}
                </n-tag>
                <n-tag
                  size="small"
                  class="capitalize"
                  v-for="(_product_amentities, _ipa) in _product.amenities?.slice(0, 5)"
                  :key="_ipa"
                  >{{ _product_amentities.title }}</n-tag
                >
                <atoms-text v-if="_product.amenities?.length > 5" caption>and more...</atoms-text>
              </n-space>
              <br />
              <div class="flex flex-wrap gap-2 justify-between md:justify-start">
                <atoms-text caption strong class="!text-primary">Created at : </atoms-text>
                <atoms-text caption
                  >{{ moment(_product._created_date).format("DD MMMM YYYY") }}
                </atoms-text>
              </div>
              <div class="flex flex-wrap gap-2 justify-between md:justify-start">
                <atoms-text caption strong class="!text-primary">Updated at : </atoms-text>
                <atoms-text caption
                  >{{
                    (_product._updated_date &&
                      moment(_product._updated_date).format("DD MMMM YYYY")) ||
                    "-"
                  }}
                </atoms-text>
              </div>
              <br />
            </div>
          </section>
        </div>
        <n-button @click="router.push({ path: `/admin/${$userStore.getClientTypeApp}/packages` })"
          >Show More</n-button
        >
      </section>
      <atoms-empty
        v-else
        message="Nothing to be found... Perhaps you are not having package yet?"
        size="250"
        height="50vh"
      ></atoms-empty>
      <br />
    </atoms-container>
  </div>
</template>
