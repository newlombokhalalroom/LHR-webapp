<script setup>
import {
  NConfigProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  NDialogProvider,
  darkTheme,
  NButton,
} from "naive-ui";
import tailwindConfig from "#tailwind-config";

const $local = reactive({
  isLight: true,
  mediaQuery: null,
});

const $checkTheme = () => {
  // todo : auto theme prefers, toggle theme for naive-ui
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    $local.isLight = false;
  } else {
    $local.isLight = true;
  }
};

watch(
  () => $local.isLight,
  (_val) => {
    if (!_val) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }
);

onMounted(() => {
  document.documentElement.style.scrollBehavior = "smooth";
  $local.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  $local.mediaQuery.addEventListener("change", $checkTheme);
  $checkTheme();

  setTimeout(() => {
    $local.isMounted = true;
  }, 1000);
});

onUnmounted(() => {
  $local.mediaQuery.removeEventListener("change", $checkTheme);
});
</script>
<template>
  <n-config-provider
    :theme-overrides="{
      common: {
        fontSize: tailwindConfig.theme.fontSize.base,
        primaryColor: tailwindConfig.theme.colors.primary,
        primaryColorHover: tailwindConfig.theme.colors['primary-lighten'],
        primaryColorPressed: tailwindConfig.theme.colors['primary-darken'],
        warningColor: tailwindConfig.theme.colors.secondary,
        warningColorHover: tailwindConfig.theme.colors['secondary-lighten'],
        warningColorPressed: tailwindConfig.theme.colors['secondary-darken'],
        borderRadius: '5px',
      },
    }"
    :theme="(!$local.isLight && darkTheme) || null"
  >
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-notification-provider :max="2">
          <n-message-provider>
            <slot />
            <client-only>
              <n-button
                type="primary"
                @click="$local.isLight = !$local.isLight"
                class="fixed bottom-4 right-3 !py-5 px-3 rounded-lg z-50 shadow-lg shadow-primary/50"
              >
                <template #icon>
                  <atoms-icon
                    flat
                    class="!text-white"
                    :name="$local.isLight ? 'weather-night' : 'white-balance-sunny'"
                  /> </template
              ></n-button>
            </client-only>
          </n-message-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>
