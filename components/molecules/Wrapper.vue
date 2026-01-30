<script setup>
import {
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NLayoutHeader,
  NSpace,
  NButton,
  NTabs,
  NTabPane,
  NList,
  NListItem,
  NDivider,
  NDrawer,
  NDrawerContent,
  NDropdown,
  useNotification,
  useLoadingBar,
} from "naive-ui";

import { h } from "vue";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";
import AtomsText from "@/components/atoms/Text.vue";
import AtomsIcon from "@/components/atoms/Icon.vue";

let $userStore = useUserStore();
let { data: $dataUser } = storeToRefs($userStore);

const route = useRoute();
const router = useRouter();
const $breakpoint = useBreakpoint();
const { $createError } = useError();
const { $addSeparator } = useNuxtApp();
const $tabsInstRef = ref(null);
const $notification = useNotification();
const $loadingBar = useLoadingBar();
const $routes = ref(router?.options?.routes);

const $local = reactive({
  routes: null,
  mainLoading: false,
  showNotification: false,
  isAllowed: true,
  isMounted: true,
  isScrolled: false,
  balance: 0,
  balanceLoading: false,
});

const $updateRoutes = () => {
  $local.routes = $routes.value
    ?.filter((_route) => {
      const isStatic = !_route.path.includes(":");
      const isVisible = !_route.meta?.hidden;
      const _funcNav = _route?.meta?.navigator;
      const isAllowed =
        typeof _funcNav === "function" ? _funcNav({ _user: $dataUser.value }) : _funcNav;
      return isStatic && isVisible && isAllowed;
    })
    ?.sort((a, b) => (a.meta?.order ?? 99) - (b.meta?.order ?? 99));
};

const $onFetchBalance = async () => {
  $local.balanceLoading = true;
  try {
    const _resp = await $userStore.get(`balances`);
    if (_resp?.status) {
      $local.balance = _resp.result;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.balanceLoading = false;
  }
};

watch(
  [() => route.fullPath, () => $dataUser.value?.scope, () => $dataUser.value?._id],
  $updateRoutes
);

const $openURL = (_url) => {
  window.open(_url, "_blank");
};

const $logout = async () => {
  $userStore.logout();
  // location.href = "/";
};

onMounted(() => {
  $updateRoutes();
  window.addEventListener("scroll", (e) => {
    if (window.scrollY > 50) {
      $local.isScrolled = true;
    } else {
      $local.isScrolled = false;
    }
  });
});

watch([() => $local.mainLoading, () => $local.balanceLoading], (_val) => {
  if (!_val) {
    $loadingBar.start();
  } else {
    $loadingBar.finish();
  }
});
</script>
<template>
  <n-layout class="w-full min-h-screen bg-transparent">
    <client-only>
      <n-layout-header class="bg-transparent">
        <nav
          class="w-full absolute top-0 left-[50%] -translate-x-[50%] bg-white dark:bg-black !z-[50]"
        >
          <div v-if="$dataUser?.client?.id" class="p-1 text-center text-black bg-secondary">
            <atoms-text caption class="!text-inherit"
              >Please complete your bussines information asap for highering up your rate
              <!-- <atoms-text
                caption
                strong
                class="inline !text-inherit"
                :href="$dataUser?.client?.type ? `/admin/${$dataUser?.client?.type}/profile` : '#'"
                >here.</atoms-text
              > -->
            </atoms-text>
          </div>
          <div
            v-else-if="$dataUser?.id && !$dataUser?.client"
            class="flex p-1 text-center text-black bg-secondary"
          >
            <atoms-text caption class="!text-inherit flex gap-1 mx-auto flex-wrap"
              >Please do not use any live payment instead of this payment's simulator

              <atoms-text
                caption
                strong
                class="!text-inherit"
                target="_blank"
                href="https://simulator.sandbox.midtrans.com/bca/va/index"
                >here.</atoms-text
              >
            </atoms-text>
          </div>
          <section class="flex items-center justify-between px-5 py-2 mx-auto md:px-0 md:container">
            <div class="flex items-center gap-2">
              <atoms-image src="/favicon.ico" height="30" :zoom="false" />
              <atoms-text v-if="!$breakpoint.mdAndDown" to="/" strong class="!no-underline"
                >Lombok Halal Room</atoms-text
              >

              <div v-if="!$breakpoint.smAndDown && !$dataUser?.id" class="flex items-center gap-2">
                <atoms-text caption>by</atoms-text>

                <atoms-image src="/media/kedaireka.svg" height="20" :zoom="false" />
              </div>

              <n-divider vertical class="!m-0" />

              <div v-if="!$dataUser?.scope?.includes('admin')">
                <n-button size="small" @click="router.push({ path: '/booking' })">
                  <template #icon
                    ><atoms-icon name="bookmark" flat size="12"></atoms-icon
                  ></template>
                  <atoms-text caption>Booking</atoms-text>
                </n-button>
              </div>
              <atoms-text v-else caption class="capitalize"
                >{{ $dataUser?.scope?.includes("super") ? "" : "Partner" }}
                {{ $dataUser?.scope }}</atoms-text
              >
              <!-- <n-button  size="tiny" text
                >Jadi Partner Kami</n-button
              > -->
              <!-- <atoms-icon name="bell" @click="$local.showNotification = true" /> -->
            </div>
            <ClientOnly>
              <div v-if="!$dataUser?.id" class="space-x-6">
                <n-button text @click="() => router.push({ path: '/authentication' })"
                  >Sign in</n-button
                >
                <n-button
                  type="primary"
                  @click="() => router.push({ path: '/authentication/signup' })"
                  >Sign up</n-button
                >
              </div>
              <n-dropdown
                v-else
                trigger="click"
                width="350"
                @update:show="
                  (val) => {
                    if (val) {
                      $onFetchBalance();
                    }
                  }
                "
                :options="[
                  {
                    key: 'header',
                    type: 'render',
                    show: !$dataUser?.client?.type?.includes('travel'),
                    render: () =>
                      h('div', {}, [
                        h(
                          NSpace,
                          {
                            gap: 5,
                            align: 'center',
                            class: 'p-3',
                          },
                          [
                            h(
                              AtomsText,
                              {
                                strong: true,
                              },
                              { default: () => 'IDR' }
                            ),
                            h('div', null, [
                              h('div', { class: 'flex gap-2' }, [
                                h(
                                  AtomsIcon,
                                  {
                                    flat: true,
                                    name: 'refresh',
                                    disabled: $local.balanceLoading,
                                    onClick: () => $onFetchBalance(),
                                  },
                                  {}
                                ),
                                h(
                                  AtomsText,
                                  {},
                                  {
                                    default: () =>
                                      $local.balanceLoading
                                        ? 'Loading...'
                                        : $addSeparator(+Number($local.balance?.amount || 0)),
                                  }
                                ),
                              ]),
                              h(
                                'div',
                                { style: 'font-size: 12px; margin-top: 2px;' },
                                $dataUser?.scope?.includes('admin')
                                  ? [
                                      h(
                                        NButton,
                                        {
                                          size: 'tiny',

                                          disabled: $local.balanceLoading,
                                          onClick: () => router.push({ path: '/admin/withdrawal' }),
                                        },
                                        { default: () => 'Open withdrawal page' }
                                      ),
                                    ]
                                  : {}
                              ),
                              h(
                                'div',
                                { style: 'font-size: 12px; margin-top: 2px;' },
                                $dataUser?.scope?.includes('user')
                                  ? [
                                      h(
                                        NButton,
                                        {
                                          size: 'tiny',

                                          disabled: $local.balanceLoading,
                                          onClick: () => router.push({ path: '/refund' }),
                                        },
                                        { default: () => 'Open refund page' }
                                      ),
                                    ]
                                  : {}
                              ),
                            ]),
                          ]
                        ),
                        h(NDivider, { class: '!mt-0 !mb-2' }),
                      ]),
                  },
                  {
                    label: 'Your Profile',
                    key: `profil`,
                    // disabled: true,
                    props: {
                      onClick: () => router.push('/profil'),
                    },
                  },
                  {
                    label: 'Settings',
                    key: `settings`,
                    disabled: true,
                    props: {
                      onClick: () => router.push('/settings'),
                    },
                  },
                  {
                    key: 'header-divider',
                    type: 'divider',
                  },
                  {
                    key: `Logout`,
                    type: 'render',
                    render: () =>
                      h('div', { class: 'p-2 ' }, [
                        h(NButton, { type: 'error', class: 'w-full' }, { default: () => 'Logout' }),
                      ]),
                    props: {
                      onClick: () => $logout(),
                    },
                  },
                ]"
              >
                <div
                  class="flex items-center gap-3 p-1 transition-all duration-100 ease-out rounded-full cursor-pointer hover:bg-primary hover:text-black hover:shadow-sm"
                >
                  <atoms-text
                    v-if="!$breakpoint.mdAndDown"
                    span
                    class="!cursor-pointer !text-inherit pl-1 capitalize"
                    >{{ $dataUser?.username || "-" }}</atoms-text
                  >
                  <atoms-avatar
                    class="cursor-pointer"
                    :src="$dataUser?.picture"
                    :zoom="false"
                    sizes="35"
                    :nickname="$dataUser?.username || 'user'"
                  ></atoms-avatar>
                </div>
              </n-dropdown>
            </ClientOnly>
          </section>
          <n-divider class="!my-0"></n-divider>
          <section class="bg-white-smoke dark:bg-black">
            <n-tabs
              v-if="$local.routes?.length > 0"
              ref="$tabsInstRef"
              :value="route.path"
              @update:value="(_path) => router.push(_path)"
              animated
              pane-class="!py-0"
              class="px-5 mx-auto md:px-0 md:container"
            >
              <n-tab-pane
                v-for="(_item, _idx) in $local.routes?.sort(
                  (a, b) => a.meta?.order - b.meta?.order
                )"
                :key="_idx"
                :name="_item.path?.toLowerCase()"
                :tab="_item.meta?.label || _item.name"
                class="capitalize !text-xs"
                display-directive="if"
              />
            </n-tabs>
          </section>
          <!-- <n-divider class="!my-0 -translate-y-[1px]"></n-divider> -->
        </nav>
        <n-drawer v-model:show="$local.showNotification" :width="502" placement="right">
          <n-drawer-content closable="" title="Notifikasi">
            <atoms-empty
              class="w-full h-full"
              image=""
              message="Belum ada notifikasi untuk Anda"
            ></atoms-empty>
          </n-drawer-content>
        </n-drawer>
      </n-layout-header>
    </client-only>

    <n-layout
      v-if="$local.isAllowed"
      position="absolute"
      class="w-full bg-transparent"
      :style="{ top: !$dataUser?.id ? '80px' : '120px' }"
    >
      <n-layout-content
        id="lhr-layout-container"
        class="overflow-x-hidden overflow-y-auto bg-transparent"
      >
        <slot />
      </n-layout-content>
    </n-layout>
    <div v-else>
      <Head>
        <Title>Tidak Ditemukan</Title>
      </Head>
      <atoms-empty
        class="w-full h-[100vh]"
        message="The page you searched cannot be accessed"
      ></atoms-empty>
    </div>
  </n-layout>
</template>
