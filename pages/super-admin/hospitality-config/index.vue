<script setup>
import { NButton, NScrollbar, NCard } from "naive-ui";
import { ref } from "vue";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";

const { data: $dataUser } = storeToRefs(useUserStore());
const router = useRouter();
const route = useRoute();

const $meta = ref({
  href: `${route.fullPath}`,
  title: "Hospitality Configurations",
  description:
    "Manage hospitality configuration such as room setup, availability, orders, and more for halal accommodation in Lombok.",
});

definePageMeta({
  label: "Hospitality Config",
  icon: "cog",
  order: 1,
  navigator: ({ _user }) => _user?.scope?.includes("super-admin"),
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

useHead({
  title: $meta.value.title,
  meta: [
    { name: "description", content: $meta.value.description },
    { property: "og:title", content: $meta.value.title },
    { property: "og:description", content: $meta.value.description },
    { property: "og:url", content: $meta.value.href },
    { name: "twitter:title", content: $meta.value.title },
    { name: "twitter:description", content: $meta.value.description },
  ],
  link: [{ rel: "canonical", href: $meta.value.href }],
});

const quickAccess = [
  {
    title: "Amenities",
    icon: "bed",
    href: "/super-admin/hospitality-config/amenities",
  },
  {
    title: "Types",
    icon: "home",
    href: "/super-admin/hospitality-config/types",
  },
  {
    title: "details",
    icon: "check",
    href: "/super-admin/hospitality-config/details",
  },
  {
    title: "Details Category",
    icon: "history",
    href: "/super-admin/hospitality-config/details-category",
  },
  {
    title: "Policy",
    icon: "cog",
    href: "/super-admin/hospitality-config/policy",
  },
  {
    title: "facilities",
    icon: "layers",
    href: "/super-admin/hospitality-config/facilities",
  },
];
</script>

<template>
  <atoms-container>
    <atoms-heading h3 class="mb-6">Quick Access: Hospitality Config</atoms-heading>

    <n-scrollbar x-scrollable>
      <div class="flex mb-10 space-x-6">
        <n-card
          v-for="(_shortcut, _i) in quickAccess"
          :key="_i"
          class="w-[10rem] h-[10rem] hover:shadow-md !cursor-pointer"
          @click="router.push({ path: _shortcut.href })"
        >
          <div class="flex flex-col items-center justify-center w-full h-full gap-3 pt-1">
            <atoms-icon :name="_shortcut.icon" flat size="48" />
            <atoms-text class="font-medium text-center">{{ _shortcut.title }}</atoms-text>
          </div>
        </n-card>
      </div>
    </n-scrollbar>
  </atoms-container>
</template>
