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
  NAlert,
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
  openCarSetter: false,

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
  } catch (error) {
    $local.data = null;
    $local.raw = null;
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
  label: "Manage Cars",
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
  <molecules-drawer
    v-model:show="$local.openCarSetter"
    :content="{
      title: 'Set Car Name',
    }"
    height="50%"
    @mounted="
      () => {
        const _fn = async () => {
          const _submit = async (_productId, _title) => {
            $local.mainLoading = true;
            try {
              if (!_productId || !_title) {
                $notification.warning({
                  title: 'Validation',
                  content: 'Please make sure all fields are filled',
                });
                return;
              }
              await $productStore.post(`${_productId}/items`, {
                title: _title,
              });
              _title = null;
              $local.openCarSetter = null;
              $onFetchMain();
            } catch (error) {
              $createError(error);
            } finally {
              $local.mainLoading = false;
            }
          };

          return reactive({
            platName: null,
            submit: _submit,
          });
        };

        return _fn;
      }
    "
  >
    <template v-slot="{ data: $data, onClose }">
      <div v-if="$data">
        <atoms-input
          :disabled="$local.mainLoading"
          placeholder="Type your car plat number"
          v-model:value="$data.platName"
          label="Car Plat"
          clearable
          required
        />
        <n-button
          type="primary"
          class="w-full"
          @click="() => $data.submit($local.openCarSetter, $data.platName)"
          >Save Car</n-button
        >
      </div>
    </template>
  </molecules-drawer>
  <div>
    <Head><Title>Manage Cars</Title></Head>
    <atoms-container>
      <br />
      <n-card :title="`${moment($dateHours()).format('dddd, DD MMMM YYYY')}`">
        <template #header-extra>
          <atoms-icon name="refresh"></atoms-icon>
        </template>
        <div class="grid md:grid-cols-3">
          <n-statistic label="Total Cars">
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
          <n-statistic label="Showed Cars">
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
      <div id="quick" class="flex flex-col md:flex-row gap-5">
        <n-button
          @click="router.push(`/admin/${$userStore.getClientTypeApp}/cars/submit`)"
          id="status-cars"
          class="md:w-auto md:grow-0"
          :disabled="$local.mainLoading"
          type="primary"
        >
          Create Car Type
        </n-button>
        <atoms-input
          id="search-cars"
          :disabled="$local.mainLoading"
          class="w-full md:w-auto md:grow"
          placeholder="Search by cars name..."
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
          class="shadow-xl hover:shadow-sm rounded-md overflow-hidden cursor-pointer transition-all duration-300 ease-out bg-white dark:bg-black"
        >
          <section class="grid grid-cols-5">
            <atoms-image-native
              :src="_product.pictures?.[0]?.picture"
              class="col-span-full md:col-span-1 relative top-0 overflow-y-hidden min-h-[200px]"
              ><template #none
                ><n-space
                  class="h-[200px] bg-white-smoke dark:bg-black-pure w-full"
                  justify="center"
                  align="center"
                >
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
            <div class="col-span-full md:col-span-4 p-5">
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
                        label: 'Edit Car Type',
                        props: {
                          onClick: () =>
                            router.push(
                              `/admin/${$userStore.getClientTypeApp}/cars/submit/${_product.id}`
                            ),
                        },
                      },
                      {
                        key: 1,
                        label: 'Set Car',
                        props: {
                          onClick: () => ($local.openCarSetter = _product.id),
                        },
                      },
                      {
                        key: 2,
                        label: 'Detail Car',
                        props: {
                          onClick: () =>
                            router.push(
                              `/admin/${$userStore.getClientTypeApp}/cars/${_product.id}`
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
                <atoms-text caption strong class="!text-primary">Price : </atoms-text>
                <atoms-text caption>IDR {{ $addSeparator(_product?.price || 0) }} </atoms-text>
              </div>
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
                  <atoms-text caption strong class="!text-primary">Cars : </atoms-text>
                  <atoms-text caption>-</atoms-text>
                </div>
                <n-scrollbar v-if="_product.items?.length > 0" x-scrollable>
                  <div class="flex gap-x-2">
                    <n-card
                      v-for="(_item, _i_item) in _product.items"
                      :key="_i_item"
                      :class="['w-[10rem]  hover:shadow-md !cursor-pointer']"
                    >
                      <div
                        class="flex flex-col items-center justify-center text-center h-full w-full"
                      >
                        <atoms-text caption class="!text-inherit">{{ _item.title }}</atoms-text>
                      </div>
                    </n-card>
                  </div>
                </n-scrollbar>
                <n-alert type="warning" v-else
                  ><atoms-text caption
                    >This car type does not have list of cars yet, please add to make it available
                    for peeople to rent</atoms-text
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
        message="Nothing to be found... Perhaps you are not having car rent yet?"
        size="250"
      ></atoms-empty>
      <br />
    </atoms-container>
  </div>
</template>
