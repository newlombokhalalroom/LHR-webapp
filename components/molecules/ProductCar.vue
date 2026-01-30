<script setup>
import {
  NForm,
  NButton,
  NTag,
  NDivider,
  NSkeleton,
  useNotification,
  NScrollbar,
  NCard,
  NTabs,
  NTabPane,
  useLoadingBar,
} from "naive-ui";
import * as uuid from "uuid";
import { useVuelidate } from "@vuelidate/core";
import { required, email, minValue } from "@vuelidate/validators";
import moment from "moment";
import { useAmenitiesStore } from "@/store/amenities";
import { useDetailStore } from "@/store/detail";
import { useProductStore } from "@/store/product";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";

const $detailStore = useDetailStore();
const { data: $dataDetail } = storeToRefs($detailStore);
const $amenitiesStore = useAmenitiesStore();
const { data: $dataAmenities } = storeToRefs($amenitiesStore);
const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);

const router = useRouter();
const route = useRoute();
const { $createError } = useError();
const { $api } = useApi();
const { $removeSeparator, $addSeparator, $uploadFile } = useNuxtApp();
const $breakpoint = useBreakpoint();
const $loadingBar = useLoadingBar();
const $notification = useNotification();

const $filterArrByCustom = (payload, target, by = "category") =>
  payload?.filter((_item) => _item?.[by?.toLowerCase()]?.toLowerCase() == target?.toLowerCase()) ||
  null;

const $findArrByCustom = (payload, target, by = "title") =>
  payload?.find((_item) => _item?.[by?.toLowerCase()]?.toLowerCase() == target?.toLowerCase()) ||
  null;

const $local = reactive({
  product: null,
  mainLoading: false,
});

const {
  data: $product,
  error: $productError,
  pending: $productPending,
  refresh: $productRefresh,
} = await useAsyncData(
  `products/${route.params.id}`,
  () =>
    $fetch(`${useRuntimeConfig()?.public.apiUrl}/products/${route.params.id}`, {
      method: "get",
    }),
  {
    transform: (payload) => payload?.result || null,
    watch: false,
  }
);

const $scrollNaive = (top = 0) => {
  const _target = document.getElementById("lhr-layout-container").parentNode;
  console.log(_target, _target.top);
  _target.scrollTo({
    behavior: "smooth",
    top: 0,
  });
};

onMounted(async () => {
  $local.mainLoading = true;
  try {
    if (!$product.value?.id) {
      throw new Error("Failed to fetch data");
    }
  } catch (error) {
    throw createError({ statusCode: 404, message: error?.message });
  } finally {
    $local.mainLoading = false;
    $scrollNaive();
  }
});
</script>
<template>
  <Head>
    <Title>{{ $product?.title }}</Title>
    <Meta name="description" :content="$product?.description" />
  </Head>
  <section v-if="!$product"></section>
  <section v-else>
    <atoms-image-native :src="$product?.client?.picture" height="250px">
      <template #none
        ><n-space
          class="bg-white-smoke dark:bg-black-pure w-full h-full"
          justify="center"
          align="center"
        >
          <atoms-icon flat size="25" name="camera" class="!text-primary" /></n-space
      ></template>
      <section class="grid grid-cols-2 w-full h-full">
        <div></div>
        <div class="grid grid-cols-2 overflow-hidden h-full">
          <atoms-image-native
            v-for="(_picture, i_picture) in Array.from(Array(4).keys())?.map(
              (_item) => $product?.pictures?.[_item]
            )"
            :key="i_picture"
            :src="$product.picture"
          >
            <template #none
              ><n-space
                class="bg-white-smoke dark:bg-black-pure w-full h-full"
                justify="center"
                align="center"
              >
                <atoms-icon
                  flat
                  size="25"
                  name="camera"
                  class="!text-primary" /></n-space></template
          ></atoms-image-native>
        </div>
      </section>
    </atoms-image-native>

    <atoms-container>
      <section
        class="space-y-2 flex flex-col md:flex-row flex-wrap items-start md:items-center gap-5"
      >
        <div class="flex-none ring-5">
          <atoms-avatar
            ref="$refPicture"
            :src="$product?.pictures?.[0]?.picture"
            class="cursor-pointer dark:!bg-black bg-white"
            sizes="150"
            nickname="account"
          />
        </div>
        <div
          class="flex-1 gap-5 flex flex-col md:flex-row flex-wrap items-start md:items-center justify-between"
        >
          <div>
            <atoms-heading h2 class="capitalize mb-1">
              {{ $product?.title }}
            </atoms-heading>
            <n-tag v-if="$product?.availability" type="primary" size="small">Available</n-tag>
            <n-tag v-else type="error" size="small">Not Available</n-tag>
            <div class="ml-1 mt-3">
              <atoms-text caption>Price</atoms-text>
              <atoms-text> IDR {{ $addSeparator($product?.price || 0) }}</atoms-text>
            </div>
          </div>
          <div>
            <n-button @click="router.back()"
              >Back <template #icon> <atoms-icon flat name="chevron-left" /> </template
            ></n-button>
          </div>
        </div>
      </section>
      <n-divider />
      <section class="space-y-5">
        <div>
          <atoms-text strong class="!text-primary">About the car</atoms-text>
          <atoms-text span v-html="$product.description || '-'"></atoms-text>
        </div>
        <div>
          <atoms-text strong class="!text-primary">Detail</atoms-text>
          <atoms-text span
            >Passenger:
            {{
              $product?.details?.find((_item) => _item.title == "Passenger")?.amount || 1
            }}</atoms-text
          >
          <atoms-text span
            >Baggage:
            {{
              $product?.details?.find((_item) => _item.title == "Payload")?.amount || 1
            }}</atoms-text
          >
          <atoms-text span
            >Driver:
            {{
              $product?.details?.find((_item) => _item.title == "Driver")
                ? "with Driver"
                : "without Driver"
            }}</atoms-text
          >
        </div>
        <div>
          <atoms-text strong class="!text-primary">Services</atoms-text>
          <div v-if="$product?.amenities?.length > 0">
            <n-tabs type="line" animated>
              <n-tab-pane name="0" tab="Includes">
                <section
                  v-if="$filterArrByCustom($product?.amenities, 'regular')?.length > 0"
                  class="grid md:grid-cols-3 gap-2"
                >
                  <div
                    v-for="(_amenity, i_amenity) in $filterArrByCustom(
                      $product?.amenities,
                      'regular'
                    ) || []"
                    :key="i_amenity"
                  >
                    <atoms-text caption strong class="!text-primary capitalize"
                      >Included</atoms-text
                    >
                    <atoms-text>{{ _amenity.title }}</atoms-text>
                  </div>
                </section>
                <atoms-empty
                  v-else
                  image=""
                  height="100"
                  message="No Services Includes"
                  class="mt-2"
                />
              </n-tab-pane>
              <n-tab-pane name="1" tab="Excludes">
                <section
                  v-if="$filterArrByCustom($product?.amenities, 'excluded')?.length > 0"
                  class="grid md:grid-cols-3 gap-2"
                >
                  <div
                    v-for="(_amenity, i_amenity) in $filterArrByCustom(
                      $product?.amenities,
                      'excluded'
                    ) || []"
                    :key="i_amenity"
                  >
                    <atoms-text caption strong class="!text-primary capitalize">{{
                      _amenity.category
                    }}</atoms-text>
                    <atoms-text>{{ _amenity?.title }} </atoms-text>
                  </div>
                </section>
                <atoms-empty
                  v-else
                  image=""
                  height="100"
                  message="No Services Excludes"
                  class="mt-2"
                />
              </n-tab-pane>
            </n-tabs>
          </div>
          <atoms-empty
            v-else
            image=""
            height="100"
            message="None of Services showed"
            class="mt-2"
          />
        </div>

        <div v-if="$product.client">
          <n-divider />
          <div
            class="shadow-xl hover:shadow-sm rounded-md overflow-hidden transition-all duration-300 ease-out bg-white dark:bg-black"
          >
            <section class="grid grid-cols-5">
              <atoms-image-native
                :src="$product.client?.picture"
                :height="$breakpoint.smAndDown ? '100px' : 'auto'"
                class="col-span-full md:col-span-1"
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
              <div class="col-span-full md:col-span-4 p-5">
                <div class="grid md:grid-cols-2 gap-5 h-full">
                  <div class="col-span-1 flex flex-col h-full">
                    <div>
                      <atoms-heading h4>{{ $product.client.name }}</atoms-heading>
                    </div>
                    <n-space class="mt-2">
                      <n-tag size="small" type="primary">
                        {{ $product.client?.title || "-" }}
                      </n-tag>
                    </n-space>
                    <div class="mt-2">
                      <atoms-text
                        span
                        v-html="$product.client?.description?.slice(0, 100) || ''"
                      ></atoms-text>
                    </div>
                  </div>
                  <div class="col-span-1 flex gap-2 md:flex-col items-end">
                    <div>
                      <n-button
                        :disabled="$dataUser?.scope?.includes('admin')"
                        @click="
                          router.push(
                            `/${$userStore.getClientTypeApp}/${$product.client?.id}`?.replaceAll(
                              'car-rent',
                              'rental'
                            )
                          )
                        "
                        >More about the rental</n-button
                      >
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
        <n-divider />
        <div>
          <atoms-text strong class="!text-primary mb-1">Policies</atoms-text>
          <div
            v-if="$product?.policies?.length > 0"
            v-for="(_policy, i_policy) in $product?.policies || []"
            :key="i_policy"
          >
            <atoms-text span strong>{{ _policy.title }} ({{ _policy?.description }})</atoms-text>
            <atoms-text span v-html="_policy.details"></atoms-text>
          </div>
          <atoms-empty v-else image="" height="100" message="No policies" class="mt-2" />
        </div>
      </section>
    </atoms-container>
    <br />
    <br />
  </section>
</template>
