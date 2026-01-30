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
import moment from "moment";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/store/user";
import { useClientStore } from "@/store/client";

const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);
const $clientStore = useClientStore();

const { $greeting } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const $breakpoint = useBreakpoint();
const { $createError } = useError();

const $local = reactive({
  mainLoading: false,
  data: null,
  raw: null,
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

onMounted(() => {
  $onFetchMain();
});

definePageMeta({
  order: 0,
  label: "Dashboard",
  title: "Car Rent Dashboard",
  navigator: ({ _user }) => {
    if (!_user?.scope?.includes("admin") || !_user?.client?.type?.includes("car")) return false;
    return true;
  },
  validation: ({ _user }) => {
    if (!_user?.scope?.includes("admin") || !_user?.client?.type?.includes("car")) return "/";
  },
});
</script>

<template>
  <div class="">
    <atoms-container v-if="!$dataUser?.id">
      <br />
      <n-skeleton height="150px"></n-skeleton>
      <br />
    </atoms-container>
    <atoms-container v-else>
      <section class="grid grid-cols-1 md:grid-cols-5 gap-10 md:items-center justify-center">
        <!-- <atoms-image
            class="col-span-full md:col-span-2 md:!justify-end"
            src="/media/journey.svg"
            height="300"
          /> -->
        <div class="col-span-full md:col-span-3 md:!justify-start">
          <div class="flex flex-wrap gap-2 items-end">
            <atoms-heading h2 class="capitalize">Hi {{ $dataUser?.username }}</atoms-heading>
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
        <div class="space-x-10 flex mb-10">
          <n-card
            v-for="(_shortcut, _ishortcut) in [
              {
                title: 'Cars',
                icon: 'car',
                href: 'cars',
              },
              {
                title: 'Availability',
                icon: 'check',
                href: 'availibility',
              },
              {
                title: 'Order',
                icon: 'history',
                href: 'order',
              },
            ]"
            :key="_ishortcut"
            class="w-[10rem] h-[10rem] hover:shadow-md !cursor-pointer"
            @click="
              () => {
                if ($dataUser?.client?.type) {
                  $router.push({ path: `/admin/${$userStore.getClientTypeApp}/${_shortcut.href}` });
                }
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
      <n-divider title-placement="left" class="!text-primary !mt-0">
        <div class="flex items-center gap-2">
          <atoms-icon name="bed" flat class="rotate-45 !mb-0 !text-inherit"></atoms-icon>
          <atoms-text span class="!text-inherit">Current Cars</atoms-text>
        </div>
      </n-divider>
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
              class="col-span-full md:col-span-1 relative top-0 overflow-y-hidden min-h-[200px]"
              ><template #none
                ><n-space class="h-[200px] bg-slate-100 w-full" justify="center" align="center">
                  <atoms-icon flat size="25" name="domain" class="!text-primary" /></n-space
              ></template>
              <n-scrollbar v-if="_product?.pictures?.length > 1" x-scrollable class="">
                <div class="flex">
                  <atoms-image-native
                    v-for="(_productPicture, _i_productPicture) in _product?.pictures"
                    :key="_i_productPicture"
                    :class="['!m-0 hover:shadow-md !cursor-pointer']"
                    :src="_productPicture.picture"
                    width="200px"
                    height="75px"
                  />
                </div>
              </n-scrollbar>
            </atoms-image-native>
            <div
              class="col-span-full md:col-span-4 p-5"
              @click.stop="router.push({ path: '/admin/car-rent/cars/' + _item.id })"
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
                        key: 0,
                        label: 'Edit Room Type',
                        props: {
                          onClick: () =>
                            router.push({ path: '/admin/car-rent/cars/submit/' + _product.id }),
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
              <div class="col-span-full space-y-2">
                <div class="flex flex-wrap gap-2 justify-between md:justify-start">
                  <atoms-text caption strong class="!text-primary">Rooms : </atoms-text>
                  <atoms-text caption>-</atoms-text>
                </div>
                <n-scrollbar v-if="_product.items?.length > 0" x-scrollable>
                  <div class="flex gap-x-2">
                    <n-card
                      v-for="(_roomItem, _iroomItem) in _product.items"
                      :key="_iroomItem"
                      :class="['w-[10rem]  hover:shadow-md !cursor-pointer']"
                    >
                      <div
                        class="flex flex-col items-center justify-center text-center h-full w-full"
                      >
                        <atoms-text caption class="!text-inherit">{{ _roomItem.title }}</atoms-text>
                      </div>
                    </n-card>
                  </div>
                </n-scrollbar>
              </div>
            </div>
          </section>
        </div>
        <n-button @click="router.push({ path: `/admin/${$userStore.getClientTypeApp}/cars` })"
          >Show More</n-button
        >
      </section>
      <atoms-empty
        v-else
        message="Nothing to be found... Perhaps you are not having cars yet?"
        size="250"
        height="50vh"
      ></atoms-empty>
      <br />
      <br />
    </atoms-container>
  </div>
</template>
