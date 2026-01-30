<script setup>
import {
  NButton,
  NCarousel,
  NCarouselItem,
  NSkeleton,
  NSpace,
  NRate,
  NTag,
  NDataTable,
  useMessage,
} from "naive-ui";
import { ref, onMounted } from "vue";
import { h } from "vue";
import axios from "axios";

const createColumns = ({ play }) => {
  return [
    {
      title: "Hotel",
      key: "hotel",
    },
    {
      title: "Kamar",
      key: "kamar",
    },
    {
      title: "Check-in-out",
      key: "cekinout",
    },
    {
      title: "Harga",
      key: "harga",
    },
    {
      title: "Review",
      key: "actions",
      render(row) {
        return h(
          NButton,
          {
            strong: true,
            tertiary: true,
            color: "green",
            size: "small",
            onClick: () => play(row),
          },
          { default: () => "ADD" }
        );
      },
    },
  ];
};

const data = [
  {
    hotel: "Grand Madani",
    kamar: "Reguler",
    cekinout: "27-28 September 2023",
    harga: "Rp.350.000",
  },
  {
    hotel: "Grand Madani",
    kamar: "Familiy",
    cekinout: "27-28 September 2023",
    harga: "Rp.540.000",
  },
];

const message = useMessage();
const columns = createColumns({
  play(row) {
    message.info(`Play ${row.title}`);
  },
});
const pagination = false;

const router = useRouter();
const $breakpoint = useBreakpoint();
const route = useRoute();
const $meta = ref({
  href: `${route.fullPath}`,
  title: "History",
  description: "your order history",
});

const { data: $clientData, pending: $clientLoading } = await useLazyAsyncData(
  "hotel-index",
  () =>
    $fetch("/api/client", {
      params: {
        type: "History",
      },
    }),
  { watch: [] }
);

onMounted(() => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

definePageMeta({
  order: 3,
  label: "History",
  // navigator: ({ _user }) => {
  //   if (!_user?.id) return false;
  //   return true;
  // },
  validation: ({ _user }) => {
    if (!_user?.id) return "/";
  },
});

useHead({
  title: $meta.value.title,
  meta: [
    {
      name: "description",
      content: $meta.value.description,
    },
    {
      rel: "canonical",
      href: $meta.value.href,
    },
    {
      rel: "amphtml",
      href: $meta.value.href,
    },
    // google
    {
      itemprop: "name",
      content: $meta.value.title,
    },
    {
      itemprop: "description",
      content: $meta.value.description,
    },
    {
      itemprop: "image",
      content: "image/here",
    },
    // twitter card
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    { name: "twitter:site", content: route.fullPath },
    {
      name: "twitter:title",
      content: $meta.value.title,
    },
    {
      name: "twitter:description",
      content: $meta.value.description,
    },
    {
      name: "twitter:image",
      content: "image/here",
    },
    {
      name: "twitter:image:alt",
      content: $meta.value.title,
    },
    {
      name: "twitter:url",
      content: $meta.value.href,
    },
    // Open Graph
    { property: "og:site_name", content: route.fullPath },
    { property: "og:type", content: "website" },
    {
      property: "og:title",
      content: $meta.value.title,
    },
    {
      property: "og:description",
      content: $meta.value.description,
    },
    {
      property: "og:image",
      content: "image/here",
    },
    {
      property: "og:url",
      content: $meta.value.href,
    },
    {
      property: "og:image:secure_url",
      content: "image/here",
    },
    {
      property: "og:image:alt",
      content: $meta.value.title,
    },
  ],
  link: [
    {
      rel: "canonical",
      href: $meta.value.href,
    },
    {
      rel: "amphtml",
      href: $meta.value.href,
    },
  ],
});
</script>

<template>
  <div class="">
    <br />
    <atoms-container class="space-y-2">
      <atoms-heading h3 class="capitalize">History Pemesanan</atoms-heading>
      <atoms-text
        >Quis officia proident tempor cillum ex elit Lorem adipisicing ad proident et
        duis.</atoms-text
      >
      <br />
    </atoms-container>
    <section>
      <AtomsContainer>
        <div class="bg-green-500 w-max px-6 rounded-tl-xl rounded-br-xl">
          <h1>Hotel</h1>
        </div>
        <div>
          <n-data-table
            :columns="columns"
            :data="data"
            :pagination="pagination"
            :bordered="false"
          />
        </div>
      </AtomsContainer>
    </section>
    <br />
    <section>
      <AtomsContainer>
        <div class="bg-green-500 w-max px-6 rounded-tl-xl rounded-br-xl">
          <h1>Transportasi</h1>
        </div>
        <div>
          <n-data-table
            :columns="columns"
            :data="data"
            :pagination="pagination"
            :bordered="false"
          />
        </div>
      </AtomsContainer>
    </section>
  </div>
</template>
