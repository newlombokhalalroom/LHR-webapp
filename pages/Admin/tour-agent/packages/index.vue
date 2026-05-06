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
  useNotification,
} from "naive-ui";
import { useUserStore } from "@/store/user";
import { useProductStore } from "@/store/product";
import { useClientStore } from "@/store/client";
import { storeToRefs } from "pinia";
import moment from "moment";

const $productStore = useProductStore();
const { data: $dataProduct } = storeToRefs($productStore);

const $clientStore = useClientStore();

const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);

const route = useRoute();
const router = useRouter();
const $notification = useNotification();
const { $addSeparator } = useNuxtApp();
const { $createError } = useError();
const $breakpoint = useBreakpoint();
const $local = reactive({
  term: null,
  mainLoading: false,
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

    const _resp = await $clientStore.get(`${$dataUser.value?.client?.id}/products`, {
      params: {
        filter: JSON.stringify({
          where: $local.term ? `products.title iLIKE '%${$local.term}%'` : `1=1`,
          order: "products._created_date DESC",
        }),
        page: _page,
        limit: _limit,
      },
    });
    if (_resp?.status) {
      $local.data = _resp.result;
      $local.raw = _resp;
    }
    console.log(`${$dataUser.value?.client?.id}/products`, _resp);
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

onMounted(() => {
  $onFetchMain();
});

definePageMeta({
  order: 2,
  label: "Packages",
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
    <Head><Title>Packages</Title></Head>
    <atoms-container>
      <br />
      <n-card :title="`${moment($dateHours()).format('dddd, DD MMMM YYYY')}`">
        <template #header-extra>
          <atoms-icon name="refresh" @click="$onFetchMain"></atoms-icon>
        </template>
        <div class="grid md:grid-cols-3">
          <n-statistic label="Total Packages">
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
      <div id="quick" class="flex flex-col md:flex-row gap-5">
        <n-button
          @click="router.push(`/admin/${$userStore.getClientTypeApp}/packages/submit`)"
          id="status-room"
          class="md:w-auto md:grow-0"
          :disabled="$local.mainLoading"
          type="primary"
        >
          New Package
        </n-button>
        <atoms-input
          id="search-room"
          :disabled="$local.mainLoading"
          class="w-full md:w-auto md:grow"
          placeholder="Search packages..."
          @keyup.enter="$onFetchMain({ page: 1 })"
          v-model:value="$local.term"
          hide-detail
          clearable
        >
          <template #append
            ><n-button
              type="primary"
              :disabled="$local.mainLoading"
              @click="$onFetchMain({ page: 1 })"
            >
              Search
            </n-button>
            <n-button
              type="error"
              :disabled="$local.mainLoading"
              @click.stop="
                () => {
                  $local.term = null;
                  $onFetchMain({ page: 1 });
                }
              "
              ><template #icon
                ><atoms-icon
                  name="close"
                  :circle="false"
                  class="!text-white" /></template></n-button
          ></template>
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
              @click.stop="
                router.push(`/admin/${$userStore.getClientTypeApp}/packages/${_item.id}`)
              "
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
                            router.push(
                              `/admin/${$userStore.getClientTypeApp}/packages/${_item.id}`
                            ),
                        },
                      },
                    ]"
                  >
                    <atoms-icon class="!rounded-full" name="dots-vertical"></atoms-icon>
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
              <!-- <n-card>
                <atoms-text
                  span
                  v-html="
                    _product.description?.slice(0, 100) +
                    `${_product.description?.length > 100 ? '...' : ''}`
                  "
                />
              </n-card>
              <br /> -->
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
        <!-- <n-card
          v-for="(_product, _i_product) in $local.data"
          :key="_i_product"
          size="small"
          :title="_product.title"
        >
          <template #header>
            <atoms-heading h5>{{ _product.title }}</atoms-heading>
            <atoms-text caption>{{ _product.description }}</atoms-text>
          </template>
          <template #header-extra>
            <n-dropdown
              trigger="click"
              :options="[
                {
                  key: 0,
                  label: 'Edit Room Type',
                  props: {
                    onClick: () =>
                      router.push({ path: '/admin/tour-agent/room/submit/' + _product.id }),
                  },
                },
                {
                  key: 1,
                  label: 'Set Room Name',
                  props: {
                    onClick: () => ($local.openRoomSetter = _product.id),
                  },
                },
                {
                  key: 2,
                  label: 'Set Availability',
                  // props: {
                  //   onClick: () => router.push({ path: '/admin/hotel/room/submit/' + _product.id }),
                  // },
                },
              ]"
            >
              <atoms-icon flat :size="20" name="dots-vertical" />
            </n-dropdown>
          </template>
          <section class="grid grid-cols-5 gap-5">
            <atoms-image-native
              :src="_product?.pictures?.[0]?.picture"
              :height="$breakpoint.smAndDown ? '200px' : '150px'"
              class="col-span-full md:col-span-1 relative top-0 overflow-y-hidden"
              ><template #none
                ><n-space class="h-[200px] bg-slate-100 w-full" justify="center" align="center">
                  <atoms-icon flat size="25" name="domain" class="!text-primary" /></n-space
              ></template>
              <n-scrollbar v-if="_product?.pictures?.length > 1" x-scrollable class="">
                <div class="flex">

                  <atoms-image-native
                    v-for="(_product_picture, _i_product_picture) in _product?.pictures"
                    :key="_i_product_picture"
                    :class="['!m-0 hover:shadow-md !cursor-pointer']"
                    :src="_product_picture.picture"
                    width="150px"
                    height="75px"
                  />
                </div>
              </n-scrollbar>
            </atoms-image-native>
            <section class="space-y-2 col-span-full md:col-span-4">
              <div class="flex flex-wrap gap-2 justify-between md:justify-start">
                <atoms-text caption strong class="!text-primary">Price : </atoms-text>
                <div class="flex gap-2">
                  <atoms-text caption>IDR {{ $addSeparator(_product.price || 0) }} </atoms-text>
                  <n-tag size="small"
                    ><atoms-text caption>per/{{ _product.units }} </atoms-text></n-tag
                  >
                </div>
              </div>


              <div class="col-span-full space-y-2">
                <div class="flex flex-wrap gap-2 justify-between md:justify-start">
                  <atoms-text caption strong class="!text-primary">Rooms : </atoms-text>
                  <atoms-text caption>-</atoms-text>
                </div>

              </div>
            </section>
          </section>
        </n-card> -->
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
      <atoms-empty
        v-else
        message="Nothing to be found... Perhaps you are not having package yet?"
        size="250"
        height="50vh"
      ></atoms-empty>
      <br />
      <br />
      <br />
    </atoms-container>
  </div>
</template>
