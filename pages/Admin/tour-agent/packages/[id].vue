<script setup>
import {
  NCard,
  NButton,
  NTag,
  NDivider,
  NGrid,
  NGi,
  NStatistic,
  NTimeline,
  NTimelineItem,
  NTable,
  NSpace,
  NSkeleton,
  NCarousel,
  useNotification,
  NTabs,
  NTabPane,
  NIcon,
} from "naive-ui";
import moment from "moment";
import { useProductStore } from "@/store/product";
import { useUserStore } from "@/store/user";

const $productStore = useProductStore();
const $userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const $notification = useNotification();
const { $addSeparator } = useNuxtApp();
const { $createError } = useErrorHandler();

const $local = reactive({
  mainLoading: false,
  data: null,
  deleteLoading: false,
});

const $onDeletePackage = async () => {
  if (confirm("Are you sure you want to delete this package? This action cannot be undone.")) {
    $local.deleteLoading = true;
    try {
      await $productStore.delete(route.params.id);
      $message.success("Package deleted successfully");
      router.push(`/admin/${$userStore.getClientTypeApp}/packages`);
    } catch (error) {
      $createError(error);
    } finally {
      $local.deleteLoading = false;
    }
  }
};

const $onFetchMain = async () => {
  $local.mainLoading = true;
  try {
    const _resp = await $productStore.get(`${route.params.id}`);
    if (_resp?.status) {
      $local.data = _resp.result;
    } else {
      throw new Error("Failed to get package details");
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $classified = {
  Halal: "halal",
  Regular: "regular",
  Excluded: "excluded",
  Days: "Days",
  Nights: "Nights",
};

const $filterArrByCustom = (payload, target, by = "category") =>
  payload?.filter((_item) => _item?.[by?.toLowerCase()]?.toLowerCase() == target?.toLowerCase()) ||
  [];

onMounted(() => {
  $onFetchMain();
});

definePageMeta({
  title: "Detail Package",
  validation: ({ _user }) => {
    if (!_user?.scope?.includes("admin")) return "/";
  },
});
</script>

<template>
  <div class="pb-20">
    <Head><Title>{{ $local.data?.title || 'Loading...' }} - Package Detail</Title></Head>
    <atoms-container v-if="!$local.mainLoading && $local.data">
      <br />
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <n-button quaternary @click="router.back()" class="mb-2 !px-0">
            <template #icon><atoms-icon name="arrow-left" class="mr-2" /></template>
            Back to List
          </n-button>
          <atoms-heading h2>{{ $local.data.title }}</atoms-heading>
          <div class="flex gap-2 mt-1">
            <n-tag size="small" type="primary" class="capitalize">{{ $local.data.trip_detail?.trip_type || 'Private trip' }}</n-tag>
            <n-tag size="small" :type="$local.data.availability ? 'success' : 'error'">
              {{ $local.data.availability ? 'Available' : 'Unavailable' }}
            </n-tag>
          </div>
        </div>

      </div>

      <n-grid x-gap="20" y-gap="20" cols="1 s:1 m:12 l:12" responsive="screen">
        <!-- Main Content -->
        <n-gi span="m:8 l:8">
          <n-card embedded :bordered="false" class="mb-5 shadow-sm overflow-hidden">
            <n-carousel show-arrow autoplay class="h-[400px] rounded-lg">
              <img
                v-for="(pic, index) in $local.data.pictures"
                :key="index"
                class="w-full h-full object-cover"
                :src="pic.picture"
              />
              <div v-if="!$local.data.pictures?.length" class="flex items-center justify-center h-full bg-gray-100 dark:bg-black-pure">
                <atoms-icon name="image-off" :size="48" class="text-gray-400" />
              </div>
            </n-carousel>
          </n-card>

          <n-tabs type="line" animated>
            <n-tab-pane name="overview" tab="Overview">
              <div class="py-4">
                <atoms-heading h4 class="mb-3">Description</atoms-heading>
                <div class="prose dark:prose-invert max-w-none mb-8" v-html="$local.data.description"></div>

                <n-divider />

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <atoms-heading h4 class="mb-4">Halal Services</atoms-heading>
                    <n-space vertical size="small">
                      <div v-for="am in $filterArrByCustom($local.data.amenities, $classified.Halal)" :key="am.id" class="flex items-center gap-2">
                        <atoms-icon name="check-circle" :size="20" class="text-green-500" />
                        <atoms-text>{{ am.title }}</atoms-text>
                      </div>
                      <atoms-text v-if="!$filterArrByCustom($local.data.amenities, $classified.Halal).length" caption>No halal services listed.</atoms-text>
                    </n-space>
                  </div>

                  <div>
                    <atoms-heading h4 class="mb-4">Inclusions</atoms-heading>
                    <n-space vertical size="small">
                      <div v-for="am in $filterArrByCustom($local.data.amenities, $classified.Regular)" :key="am.id" class="flex items-center gap-2">
                        <atoms-icon name="plus-circle" :size="20" class="text-blue-500" />
                        <atoms-text>{{ am.title }}</atoms-text>
                      </div>
                    </n-space>
                  </div>

                  <div>
                    <atoms-heading h4 class="mb-4">Exclusions</atoms-heading>
                    <n-space vertical size="small">
                      <div v-for="am in $filterArrByCustom($local.data.amenities, $classified.Excluded)" :key="am.id" class="flex items-center gap-2">
                        <atoms-icon name="minus-circle" :size="20" class="text-red-500" />
                        <atoms-text>{{ am.title }}</atoms-text>
                      </div>
                    </n-space>
                  </div>
                </div>
              </div>
            </n-tab-pane>

            <n-tab-pane name="itinerary" tab="Itinerary">
              <div class="py-4">
                <n-timeline>
                  <n-timeline-item
                    v-for="(it, index) in $local.data.itineraries"
                    :key="index"
                    :title="`Day ${it.day} - ${it.time}`"
                    :content="it.activity"
                    type="info"
                  >
                    <template #footer>
                      <atoms-text caption>{{ it.description }}</atoms-text>
                    </template>
                  </n-timeline-item>
                  <n-timeline-item v-if="!$local.data.itineraries?.length" title="No itineraries" content="No activities planned yet." />
                </n-timeline>
              </div>
            </n-tab-pane>

            <n-tab-pane v-if="$local.data.trip_detail?.trip_type === 'Open trip'" name="schedules" tab="Schedules & Quotas">
              <div class="py-4">
                <n-table :bordered="false" :single-line="false">
                  <thead>
                    <tr>
                      <th>Departure</th>
                      <th>Return</th>
                      <th>Quota</th>
                      <th>Available</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="sch in $local.data.schedules" :key="sch.id">
                      <td>{{ moment(sch.departure_date).format('DD MMM YYYY') }}</td>
                      <td>{{ moment(sch.return_date).format('DD MMM YYYY') }}</td>
                      <td>{{ sch.total_quota }} seats</td>
                      <td :class="sch.available_quota < 5 ? 'text-red-500 font-bold' : ''">{{ sch.available_quota }} seats</td>
                      <td>
                        <n-tag size="small" :type="sch.status === 'ready' ? 'success' : 'error'">
                          {{ sch.status }}
                        </n-tag>
                      </td>
                    </tr>
                    <tr v-if="!$local.data.schedules?.length">
                      <td colspan="5" class="text-center py-8 text-gray-400 italic">No schedules defined yet.</td>
                    </tr>
                  </tbody>
                </n-table>
              </div>
            </n-tab-pane>

            <n-tab-pane name="policies" tab="Policies">
              <div class="py-4 space-y-6">
                <div v-for="policy in $local.data.policies" :key="policy.id">
                  <atoms-heading h4 class="mb-2">{{ policy.title }}</atoms-heading>
                  <div class="bg-gray-50 dark:bg-black-smoke p-4 rounded-lg">
                    <atoms-text>{{ policy.details }}</atoms-text>
                  </div>
                </div>
                <div v-if="!$local.data.policies?.length" class="text-center py-8 text-gray-400 italic">No specific policies listed.</div>
              </div>
            </n-tab-pane>
          </n-tabs>
        </n-gi>

        <!-- Sidebar Info -->
        <n-gi span="m:4 l:4">
          <div class="sticky top-20 space-y-5">
            <n-card title="Pricing Summary" class="shadow-sm">
              <n-statistic label="Base Price" class="mb-4">
                <template #prefix>IDR</template>
                <atoms-heading h3>{{ $addSeparator($local.data.price) }}</atoms-heading>
                <template #suffix>/ package</template>
              </n-statistic>
              <n-divider />
              <div class="space-y-3">
                <div class="flex justify-between">
                  <atoms-text caption>Duration</atoms-text>
                  <atoms-text strong>
                    {{ $local.data.details?.find(d => d.title === 'Days')?.amount || 0 }} Days / 
                    {{ $local.data.details?.find(d => d.title === 'Nights')?.amount || 0 }} Nights
                  </atoms-text>
                </div>
                <div class="flex justify-between">
                  <atoms-text caption>Trip Type</atoms-text>
                  <atoms-text strong>{{ $local.data.trip_detail?.trip_type || 'Private' }}</atoms-text>
                </div>
              </div>
            </n-card>

            <n-card title="Quick Actions" size="small" class="shadow-sm">
              <n-space vertical>
                <n-button block type="primary" @click="router.push(`/admin/${$userStore.getClientTypeApp}/packages/submit/${$local.data.id}`)">
                  Edit Package Information
                </n-button>
                <n-button 
                  block 
                  type="error" 
                  :loading="$local.deleteLoading"
                  @click="$onDeletePackage"
                >
                  Delete Package
                </n-button>
              </n-space>
            </n-card>
          </div>
        </n-gi>
      </n-grid>
    </atoms-container>

    <!-- Loading Skeleton -->
    <atoms-container v-else>
      <br />
      <n-skeleton text :repeat="2" height="40px" class="mb-10" />
      <n-grid x-gap="20" cols="12">
        <n-gi span="8">
          <n-skeleton height="400px" class="mb-5" />
          <n-skeleton text :repeat="10" />
        </n-gi>
        <n-gi span="4">
          <n-skeleton height="300px" />
        </n-gi>
      </n-grid>
    </atoms-container>
  </div>
</template>
