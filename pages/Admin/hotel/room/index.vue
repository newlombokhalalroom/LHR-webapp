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
  NAlert,
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
  showDropdown: null,
  openRoomSetter: false,
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
    const _page = $local.page;
    const _limit = _payload?.limit || $local.limit;

    const _resp = await $clientStore.get(`${$dataUser.value?.client?.id}/products`, {
      params: {
        filter: JSON.stringify({
          where: $local.term ? `products.title iLIKE '%${$local.term}%'` : "1=1",
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

    console.log($local.data);
  } catch (error) {
    $local.data = null;
    $local.raw = null;
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onSubmitRoom = async (_productId, _title) => {
  $local.mainLoading = true;
  try {
    if (!_productId || !_title) {
      $notification.warning({
        title: "Validation",
        content: "Pleasee make sure all fields are filled",
      });
      return;
    }
    await $productStore.post(`${_productId}/items`, {
      title: _title,
    });
    $onFetchMain();
    $local.openRoomSetter = null;
    $local.roomName = null;
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
  label: "Manage Room",
  navigator: ({ _user }) => {
    if (!_user?.scope?.includes("admin") || !_user?.client?.type?.includes("hotel")) return false;
    return true;
  },
  validation: ({ _user }) => {
    const isAdmin = _user?.scope?.includes("admin");
    const isHotel = _user?.client?.type?.toLowerCase().includes("hotel");

    if (!isAdmin || !isHotel) return "/admin";
    return true;
  },
});
</script>
<template>
  <molecules-drawer
    v-model:show="$local.openRoomSetter"
    :content="{
      title: 'Set Room Name',
    }"
    height="50%"
  >
    <div>
      <atoms-input
        :disabled="$local.mainLoading"
        placeholder="Type your room name (ex. Room 001 or Room Avengers)"
        v-model:value="$local.roomName"
        label="Room Name"
        clearable
        required
      />
      <n-button
        type="primary"
        class="w-full"
        @click="() => $onSubmitRoom($local.openRoomSetter, $local.roomName)"
        >Save Room</n-button
      >
    </div>
  </molecules-drawer>
  <div>
    <Head><Title>Manage Room</Title></Head>
    <atoms-container>
      <br />
      <n-card :title="`${moment($dateHours()).format('dddd, DD MMMM YYYY')}`">
        <template #header-extra>
          <atoms-icon name="refresh"></atoms-icon>
        </template>
        <div class="grid md:grid-cols-3">
          <n-statistic label="Total Room">
            <div>
              <n-number-animation
                ref="$countAnimationInstRef"
                show-separator
                :from="0"
                :to="$local.raw?.count || 0"
                :active="true"
              />
            </div>
          </n-statistic>
          <n-statistic label="Showed Room">
            <div>
              <n-number-animation
                ref="$countAnimationInstRef"
                show-separator
                :from="0"
                :to="$local.limit || 0"
                :active="true"
              />
            </div>
          </n-statistic></div
      ></n-card>
      <br />
      <div id="quick" class="flex flex-col gap-5 md:flex-row">
        <n-button
          @click="router.push(`/admin/${$userStore.getClientTypeApp}/room/submit`)"
          id="status-room"
          class="md:w-auto md:grow-0"
          :disabled="$local.mainLoading"
          type="primary"
        >
          Create Room Type
        </n-button>
        <atoms-input
          id="search-room"
          :disabled="$local.mainLoading"
          class="w-full md:w-auto md:grow"
          placeholder="Search by rooms name..."
          @keyup.enter="$onFetchMain({ page: 1 })"
          v-model:value="$local.term"
          hide-detail
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
              @click="
                () => {
                  $local.term = null;
                  $onFetchMain({ page: 1 });
                }
              "
              type="error"
              :disabled="$local.mainLoading"
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
          class="overflow-hidden transition-all duration-300 ease-out bg-white rounded-md shadow-xl cursor-pointer hover:shadow-sm dark:bg-black"
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
              class="p-5 col-span-full md:col-span-4"
              @click.stop="router.push(`/admin/${$userStore.getClientTypeApp}/room/${_product.id}`)"
            >
              <div class="grid grid-cols-2">
                <div class="flex flex-col h-full col-span-1">
                  <div>
                    <atoms-heading h4>{{ _product.title }}</atoms-heading>
                  </div>
                </div>
                <div class="flex flex-col items-end justify-center col-span-1 gap-2">
                  <n-dropdown
                    :show="$local.showDropdown == _product.id"
                    @clickoutside="$local.showDropdown = null"
                    :options="[
                      // {
                      //   key: 0,
                      //   label: 'Detail Room',
                      //   props: {
                      //     onClick: () =>
                      //       router.push(
                      //         `/admin/${$userStore.getClientTypeApp}/room/${_product.id}`
                      //       ),
                      //   },
                      // },
                      {
                        key: 1,
                        label: 'Edit Room Type',
                        props: {
                          onClick: () =>
                            router.push(
                              `/admin/${$userStore.getClientTypeApp}/room/submit/${_product.id}`
                            ),
                        },
                      },
                      {
                        key: 2,
                        label: 'Set Room Name',
                        props: {
                          onClick: () => ($local.openRoomSetter = _product.id),
                        },
                      },
                    ]"
                  >
                    <atoms-icon
                      @click.stop="$local.showDropdown = _product.id"
                      class="!rounded-full"
                      name="dots-vertical"
                    ></atoms-icon>
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
              <div class="flex flex-wrap justify-between gap-2 md:justify-start">
                <atoms-text caption strong class="!text-primary">Created at : </atoms-text>
                <atoms-text caption
                  >{{ moment(_product._created_date).format("DD MMMM YYYY") }}
                </atoms-text>
              </div>
              <div class="flex flex-wrap justify-between gap-2 md:justify-start">
                <atoms-text caption strong class="!text-primary">Updated at : </atoms-text>
                <atoms-text caption
                  >{{
                    (_product._updated_date &&
                      moment(_product._updated_date).format("DD MMMM YYYY")) ||
                    "-"
                  }}
                </atoms-text>
              </div>
              <div class="space-y-2 col-span-full">
                <div class="flex flex-wrap justify-between gap-2 md:justify-start">
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
                        class="flex flex-col items-center justify-center w-full h-full text-center"
                      >
                        <atoms-text caption class="!text-inherit">{{ _roomItem.title }}</atoms-text>
                      </div>
                    </n-card>
                  </div>
                </n-scrollbar>
                <n-alert type="warning" v-else
                  ><atoms-text caption
                    >This room type does not have list of rooms yet, please add to make it available
                    for peeople to booking</atoms-text
                  ></n-alert
                >
              </div>
            </div>
          </section>
        </div>
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
        message="Nothing to be found... Perhaps you are not having room yet?"
        size="250"
      ></atoms-empty>
      <br />
    </atoms-container>
  </div>
</template>
