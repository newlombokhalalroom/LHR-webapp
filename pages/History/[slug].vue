<script setup>
definePageMeta({
  hidden: true,
});

import {
  NPagination,
  useLoadingBar,
  NCard,
  NButton,
  NDivider,
  NSpace,
  NTag,
  NCheckbox,
  NCheckboxGroup,
  useMessage,
  NSkeleton,
} from "naive-ui";

import moment from "moment/min/moment-with-locales";
moment.locale("id");

const { $, $citiesType, $provincesType } = useNuxtApp();
const config = useRuntimeConfig();
const route = useRoute();
const router = useRouter();
const $message = useMessage();
const $loadingBar = useLoadingBar();
const $breakpoint = useBreakpoint();
const { $storage } = useStorage();
const $local = reactive({
  mainLoading: false,
});

const $openLink = (_url, _target = "_self") => {
  if (_url) {
    window.open(_url, _target);
  }
};

const { data: $clientData, pending: $clientLoading } = await useLazyAsyncData(
  "hotel-index",
  () =>
    $fetch("/api/client", {
      params: {
        slug: route?.params?.slug,
      },
    }),
  { watch: [] }
);
</script>
<template>
  <atoms-image
    v-if="$clientLoading || $clientData?.picture"
    class="bg-white-smoke relative top-0 left-0"
    :src="$clientData.picture"
    width="10000"
    :height="$breakpoint.mdAndDown ? 250 : 500"
    :image="{
      class: 'w-full bg-black',
    }"
  >
    <template #none><atoms-icon flat size="25" name="train-car" class="!text-primary" /></template>
    <template #custom>
      <div class="w-full h-full absolute top-0 left-0 bg-black bg-opacity-50"></div>
    </template>
  </atoms-image>
  <div v-else class="h-[250px] bg-primary-darken relative top-0 left-0"></div>
  <atoms-container>
    <n-button @click="router.push({ path: '/transportation' })" class="-translate-y-28 !text-white"
      >Back to main page</n-button
    >
    <n-card class="mx-auto -translate-y-24">
      <div v-if="!$clientData || $clientLoading" class="space-y-2">
        <n-skeleton :repeat="2"></n-skeleton>
        <n-skeleton :repeat="2" width="50%"></n-skeleton>
      </div>
      <div v-else class="space-y-2">
        <Head>
          <Title>{{ $clientData.name }}</Title>
        </Head>
        <atoms-heading>
          {{ $clientData.name }}
        </atoms-heading>
        <n-space>
          <n-tag size="small" type="primary"> Halal Certified </n-tag>
          <n-tag size="small"> Transportation </n-tag>
          <n-tag size="small"> Safety Secured </n-tag></n-space
        >
        <br />
        <atoms-text class="mt-2">{{ $clientData.description }}</atoms-text>
        <!-- <div class="flex items-center gap-3">
          <div>
            <atoms-avatar
              size="25"
              :src="$articleResp?.result?.[0]?.avatar"
              :nickname="$articleResp?.result?.[0]?.user?.nickname || 'admin'"
            />
          </div>
          <div>
            <atoms-text span class="capitalize"
              >Diposting oleh
              {{
                $articleResp?.result?.[0]?.user?.nickname || "admin"
              }}</atoms-text
            >
            <div class="flex gap-1 items-center">
              <atoms-icon flat name="history" />
              <atoms-text span class="font-normal">{{
                moment($articleResp?.result?.[0]?._publishedDate).fromNow()
              }}</atoms-text>
            </div>
          </div>
        </div> -->
      </div>
    </n-card>
    <!-- {{ $articleResp?.result?.[0]?.user || "none" }} -->
  </atoms-container>
</template>
