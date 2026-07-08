<script setup>
import {
  NCard,
  NButton,
  NDivider,
  NSpace,
  NSkeleton,
  NTag,
} from "naive-ui";
import moment from "moment";

const route = useRoute();
const router = useRouter();
const { $addSeparator } = useNuxtApp();
const { $api } = useApi();
const { $createError } = useErrorHandler();

const $local = reactive({
  mainLoading: false,
  invoice: null,
});

const $onFetchInvoice = async () => {
  $local.mainLoading = true;
  try {
    const _resp = await $api.get(`/orders/${route.params.id}/invoice`);
    if (_resp?.status) {
      $local.invoice = _resp.result;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};


onMounted(() => {
  $onFetchInvoice();
});

definePageMeta({
  hidden: true,
});
</script>

<template>
  <div class="pb-20">
    <Head><Title>Invoice - {{ $local.invoice?.id?.slice(0, 8) || 'Loading...' }}</Title></Head>

    <atoms-container v-if="$local.mainLoading">
      <br />
      <n-skeleton height="400px" />
    </atoms-container>

    <atoms-container v-else-if="$local.invoice">
      <br />
      <!-- Print-only Styling -->
      <div class="flex justify-between items-center mb-4 print:hidden">
        <n-button @click="router.back()">← Back</n-button>
      </div>

      <!-- Invoice Content -->
      <n-card class="invoice-card">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <atoms-heading h2>INVOICE</atoms-heading>
            <atoms-text caption class="!text-primary">Lombok Halal Room</atoms-text>
          </div>
          <div class="text-right">
            <n-tag :type="$local.invoice.status === 'done' ? 'success' : $local.invoice.status === 'cancelled' ? 'error' : 'warning'" size="large">
              {{ $local.invoice.status?.toUpperCase() }}
            </n-tag>
          </div>
        </div>

        <n-divider />

        <!-- Order Info -->
        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <div class="space-y-2">
            <div>
              <atoms-text caption strong class="!text-primary">Order ID</atoms-text>
              <atoms-text class="font-mono text-sm">{{ $local.invoice.id }}</atoms-text>
            </div>
            <div>
              <atoms-text caption strong class="!text-primary">Order Date</atoms-text>
              <atoms-text>{{ moment($local.invoice._created_date).format("DD MMMM YYYY, HH:mm") }}</atoms-text>
            </div>
            <div>
              <atoms-text caption strong class="!text-primary">Check-in</atoms-text>
              <atoms-text>{{ moment($local.invoice.start_date).format("DD MMMM YYYY") }}</atoms-text>
            </div>
            <div>
              <atoms-text caption strong class="!text-primary">Check-out</atoms-text>
              <atoms-text>{{ moment($local.invoice.end_date).format("DD MMMM YYYY") }}</atoms-text>
            </div>
          </div>

          <div class="space-y-2">
            <div v-if="$local.invoice.userDetails">
              <atoms-text caption strong class="!text-primary">Tourist</atoms-text>
              <atoms-text>{{ $local.invoice.userDetails.first_name }} {{ $local.invoice.userDetails.last_name }}</atoms-text>
              <atoms-text caption>{{ $local.invoice.userDetails.email }}</atoms-text>
              <atoms-text caption>{{ $local.invoice.userDetails.phone }}</atoms-text>
            </div>
            <div v-if="$local.invoice.clientDetails">
              <atoms-text caption strong class="!text-primary">Partner</atoms-text>
              <atoms-text>{{ $local.invoice.clientDetails.name }}</atoms-text>
            </div>
          </div>
        </div>

        <n-divider />

        <!-- Order Items Table -->
        <div class="mb-6">
          <atoms-text strong class="mb-3 block">Order Details</atoms-text>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b dark:border-gray-700">
                  <th class="text-left py-2 px-1">No</th>
                  <th class="text-left py-2 px-1">Package Name</th>
                  <th class="text-center py-2 px-1">Qty</th>
                  <th class="text-right py-2 px-1">Price</th>
                  <th class="text-right py-2 px-1">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(_item, _i) in $local.invoice.orderItems" :key="_i">
                  <tr class="align-top" :class="{ 'border-b dark:border-gray-800': !_item.hotel }">
                    <td class="py-2 px-1">{{ _i + 1 }}</td>
                    <td class="py-2 px-1">{{ _item.title || '-' }}</td>
                    <td class="text-center py-2 px-1">{{ _item.quantity || 1 }}</td>
                    <td class="text-right py-2 px-1">IDR {{ $addSeparator(Number(_item.price || 0)) }}</td>
                    <td class="text-right py-2 px-1">IDR {{ $addSeparator(Number(_item.price || 0) * Number(_item.quantity || 1)) }}</td>
                  </tr>
                  <tr v-if="_item.hotel" class="border-b dark:border-gray-800 align-top text-gray-500">
                    <td class="py-2 px-1"></td>
                    <td class="py-2 px-1 pl-4 border-l-2 border-primary">
                      Hotel: {{ _item.hotel.name }}
                      <br />
                      <span class="text-xs">
                        ({{ Math.ceil((_item.quantity || 1) / 2) }} room(s) x {{ Math.max(1, moment($local.invoice.end_date).diff(moment($local.invoice.start_date), 'days')) }} night(s))
                      </span>
                    </td>
                    <td class="text-center py-2 px-1">-</td>
                    <td class="text-right py-2 px-1">IDR {{ $addSeparator(Number(_item.hotel.price_per_night || 0)) }} / night</td>
                    <td class="text-right py-2 px-1">
                      IDR {{ $addSeparator(Number(_item.hotel.price_per_night || 0) * Math.max(1, moment($local.invoice.end_date).diff(moment($local.invoice.start_date), 'days')) * Math.ceil((_item.quantity || 1) / 2)) }}
                    </td>
                  </tr>
                </template>
              </tbody>
              <tfoot>
                <tr class="font-bold border-t-2 dark:border-gray-600">
                  <td colspan="4" class="text-right py-3 px-1">Total</td>
                  <td class="text-right py-3 px-1">IDR {{ $addSeparator(Number($local.invoice.total || 0)) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <n-divider />

        <!-- Footer -->
        <div class="text-center">
          <atoms-text caption>Thank you for booking with Lombok Halal Room.</atoms-text>
          <br />
          <atoms-text caption class="!text-primary">www.lombokhalalroom.com</atoms-text>
        </div>
      </n-card>
      <br />
    </atoms-container>

    <atoms-container v-else>
      <br />
      <atoms-empty image="" message="Invoice not found." class="bg-white dark:bg-black" />
    </atoms-container>
  </div>
</template>

<style scoped>
@media print {
  .print\\:hidden {
    display: none !important;
  }
  .invoice-card {
    box-shadow: none !important;
    border: none !important;
  }
}
</style>
