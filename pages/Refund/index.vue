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
  NSpace,
  NAlert,
  useNotification,
  useLoadingBar,
} from "naive-ui";
import moment from "moment/min/moment-with-locales";
import { ref, reactive, computed, watch, onMounted } from "vue";

import { useUserStore } from "@/store/user";
import { useProductStore } from "@/store/product";
import { useClientStore } from "@/store/client";
import useApi from "@/composables/useApi";
import { storeToRefs } from "pinia";

moment.locale("id");

const $productStore = useProductStore();
const { data: $dataProduct } = storeToRefs($productStore);

const $clientStore = useClientStore();

const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);

const route = useRoute();
const router = useRouter();
const $loadingBar = useLoadingBar();
const $notification = useNotification();
const { $api } = useApi();
const { $addSeparator, $removeSeparator } = useNuxtApp();
const { $createError } = useError();
const $breakpoint = useBreakpoint();

const $local = reactive({
  term: null,
  mainLoading: false,

  openCardChanger: false,
  openWithdrawal: false, // dipakai ulang sbg "openRefund"
  openWithdrawalConfirmation: null, // objek refund/withdraw untuk modal konfirmasi

  balanceLoading: false,
  balance: null,

  cardLoading: false,
  card: null,

  data: null, // list refund/withdraw
  raw: null,
  page: 1,
  limit: 5,
});

/* ---------------- Fetch list (pakai endpoint withdrawal dulu) ---------------- */
const $onFetchWithdrawal = async (_payload) => {
  $local.mainLoading = true;
  try {
    $local.page = _payload?.page || 1;
    const _limit = _payload?.limit || 5;
    const _page = $local.page;

    const _resp = await $api.get(`/withdrawals`, {
      params: {
        filter: JSON.stringify({
          order: "_created_date ASC",
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
    $local.raw = null;
    $local.data = null;
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

/* ---------------- Balance & bank/card ---------------- */
const $onFetchBalance = async () => {
  $local.balanceLoading = true;
  try {
    const _resp = await $userStore.get("balances");
    if (_resp?.status) {
      $local.balance = _resp.result;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.balanceLoading = false;
  }
};

const $onFetchBank = async () => {
  $local.mainLoading = true;
  try {
    const _resp = await $userStore.get("banks");
    if (_resp?.status) {
      // simpan jika perlu
      // $local.banks = _resp.result;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onFetchCard = async () => {
  $local.cardLoading = true;
  try {
    const _resp = await $api.get(`/cards`);
    if (_resp?.status) {
      $local.card = _resp.result;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.cardLoading = false;
  }
};

const $onSubmitCard = async (_payload) => {
  $local.cardLoading = true;
  try {
    if (!_payload?.cardNumber || !_payload?.cardHolder || !_payload?.bank?.id) {
      throw new Error("Please fill the fields");
    }

    const body = {
      bankId: _payload?.bank?.id,
      cardNumber: _payload?.cardNumber,
      cardHolder: _payload?.cardHolder,
    };

    if (_payload?.id) {
      await $api.put(`/cards`, body);
    } else {
      await $api.post(`/cards`, body);
    }

    await $onFetchCard();

    $notification.success({
      title: "Success",
      content: `Your bank account was successfully saved`,
    });

    $local.openCardChanger = false;
  } catch (error) {
    $createError(error);
  } finally {
    $local.cardLoading = false;
  }
};

/* ---------------- Submit Refund (pakai /withdrawals dulu) ---------------- */
const $onSubmitWithdraw = async (_payload, _card) => {
  $local.cardLoading = true;
  try {
    const amount = Number(_payload?.local?.amount || 0);
    const balance = Number($local.balance?.amount || 0);

    if (!amount || !_card) {
      $notification.warning({
        title: "Incomplete",
        content: "Please fill the amount and make sure your bank account is set.",
      });
      return;
    }

    // VALIDASI SALDO: tampilkan notifikasi jika tidak cukup
    if (amount > balance) {
      $notification.error({
        title: "Saldo tidak cukup",
        content: `Nominal refund (IDR ${$addSeparator(
          amount
        )}) melebihi saldo sekarang (IDR ${$addSeparator(balance)}).`,
        duration: 4000,
      });
      return;
    }

    if (confirm("Are you sure to continue")) {
      await $api.post(`/withdrawals`, { amount });

      await $onFetchBalance();
      await $onFetchWithdrawal();

      $notification.success({
        title: "Success",
        content: `Your refund was successfully created`,
      });

      $local.openWithdrawal = false;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.cardLoading = false;
  }
};

/* ---------------- Loading bar watcher (rapi & aman) ---------------- */
watch([() => $local.mainLoading, () => $local.balanceLoading, () => $local.cardLoading], (vals) => {
  if (vals.some(Boolean)) $loadingBar.start();
  else setTimeout(() => $loadingBar.finish(), 200);
});

onMounted(async () => {
  await $onFetchBalance();
  await $onFetchCard();
  await $onFetchWithdrawal();
});

/* ---------------- Route meta: user biasa boleh akses ---------------- */
definePageMeta({
  label: "Refund",
  validation: ({ _user }) => {
    if (!_user?.id) return "/";
  },
});
</script>

<template>
  <div>
    <!-- Modal Konfirmasi -->
    <molecules-drawer
      v-model:show="$local.openWithdrawalConfirmation"
      :content="{ title: 'Refund Confirmation' }"
      @closed="
        () => {
          $local.openWithdrawalConfirmation = null;
        }
      "
    >
      <template #default="{ data: $data, onClose: $onClose }">
        <n-space align="center" :justify="center" vertical>
          <mdicon name="information" :width="200" :height="200" />
          <br />
          <atoms-heading h2> Refund {{ $local.openWithdrawalConfirmation?.status }} </atoms-heading>
          <br />
          <atoms-text span>
            Your refund has been {{ $local.openWithdrawalConfirmation?.status }}!
          </atoms-text>
          <atoms-text span>Details of transaction are included below</atoms-text>
        </n-space>
        <n-divider />
        <n-space align="center" justify="space-between">
          <atoms-text>Total Amount</atoms-text>
          <atoms-text
            >IDR {{ $addSeparator(+($local.openWithdrawalConfirmation?.amount || 0)) }}</atoms-text
          >
        </n-space>
        <n-divider />
        <n-space align="center" justify="space-between">
          <atoms-text>Paid To</atoms-text>
          <atoms-text>
            {{ $local.openWithdrawalConfirmation?.bank_name || $local.card?.bank?.title || "-" }}
          </atoms-text>
        </n-space>
        <n-divider />
        <n-space align="center" justify="space-between">
          <atoms-text>Transaction Date</atoms-text>
          <atoms-text>
            {{
              moment($local.openWithdrawalConfirmation?._created_date).format("DD MMMM YYYY HH:mm")
            }}
          </atoms-text>
        </n-space>
      </template>
    </molecules-drawer>

    <!-- Drawer Ubah/Tambah Kartu -->
    <molecules-drawer
      v-model:show="$local.openCardChanger"
      :content="{ title: 'Bank Account' }"
      @mounted="
        () => {
          const _fn = async () => {
            const _var = reactive({
              banks: null,
              bank: null,
              id: $local.card?.id,
              bankId: $local.card?.bank_id,
              cardNumber: $local.card?.card_number,
              cardHolder: $local.card?.card_name || $local.card?.card_holder,
            });
            try {
              const _resp = await $api.get('/banks');
              _var.banks = _resp?.result;
              if (_var?.banks?.length > 0) {
                _var.bank = _var?.banks?.find((_item) => _item.id == _var?.bankId);
              }
            } finally {
              $local.mainLoading = false;
              return _var;
            }
          };
          return _fn;
        }
      "
      @closed="
        () => {
          $local.openCardChanger = false;
        }
      "
    >
      <template #default="{ data: $data }">
        <div>
          <div v-if="$data">
            <atoms-select
              label="Select Bank"
              :options="$data?.banks?.map((_item) => ({ label: _item.title, value: _item })) || []"
              v-model:value="$data.bank"
              :disabled="$local.cardLoading"
              filterable
              clearable
              remote
            />
            <atoms-input
              v-model:value="$data.cardNumber"
              :disabled="$local.cardLoading"
              label="Account Number"
              clearable
              required
            />
            <atoms-input
              v-model:value="$data.cardHolder"
              label="Name Holder"
              :disabled="$local.cardLoading"
              clearable
              required
            />
          </div>

          <n-button :disabled="$local.cardLoading" type="primary" @click="$onSubmitCard($data)">
            Save
          </n-button>
        </div>
      </template>
    </molecules-drawer>

    <!-- Drawer Request Refund -->
    <molecules-drawer
      v-model:show="$local.openWithdrawal"
      :content="{ title: 'Request Refund' }"
      @mounted="
        () => {
          const _fn = async () => {
            const local = reactive({ amount: null });

            const nominal = computed({
              get() {
                return $addSeparator(local.amount || 0);
              },
              set(v) {
                local.amount = Number($removeSeparator(v));
              },
            });

            const currentBalance = computed(() => Number($local.balance?.amount || 0));
            const insufficient = computed(() => Number(local.amount || 0) > currentBalance.value);
            const remaining = computed(() =>
              Math.max(currentBalance.value - Number(local.amount || 0), 0)
            );

            return { local, nominal, currentBalance, insufficient, remaining };
          };
          return _fn;
        }
      "
      @closed="
        () => {
          $local.openCardChanger = false;
        }
      "
    >
      <template #default="{ data: $data }">
        <div v-if="$data">
          <!-- Saldo sekarang -->
          <n-alert type="info" title="Current Balance" class="mb-3">
            IDR {{ $addSeparator($data.currentBalance || 0) }}
          </n-alert>

          <section class="grid grid-cols-2 gap-5">
            <n-card
              v-for="(_item, _iitem) in [100000, 150000, 350000, 500000]"
              :key="_iitem"
              :class="[
                '!cursor-pointer',
                $data.local?.amount && $data.local?.amount == _item ? '!bg-primary' : '',
              ]"
              @click="$data.nominal = _item"
            >
              <atoms-text span>IDR&nbsp;{{ $addSeparator(_item) }}</atoms-text>
            </n-card>
          </section>

          <br />

          <atoms-input
            placeholder="Type amount..."
            label="Nominal"
            v-model:value="$data.nominal"
            :disabled="$local.mainLoading"
            required
          >
            <template #prepend><n-button>IDR</n-button></template>
          </atoms-input>

          <!-- Warning jika saldo tidak cukup -->
          <n-alert v-if="$data.insufficient" type="error" title="Saldo tidak cukup" class="mt-2">
            Nominal refund melebihi saldo sekarang. Kurangi nominal atau isi saldo terlebih dahulu.
          </n-alert>

          <!-- Sisa saldo -->
          <div class="mt-2">
            <atoms-text caption strong>Remaining after refund </atoms-text>
            <div>IDR {{ $addSeparator($data.remaining || 0) }}</div>
          </div>

          <section class="mt-4 space-y-2">
            <div class="space-y-1">
              <atoms-text caption strong class="!text-primary capitalize"
                >Transaction Date</atoms-text
              >
              <atoms-text>{{ moment().format("DD MMMM YYYY, HH:mm") }}</atoms-text>
            </div>
            <div class="space-y-1">
              <atoms-text caption strong class="!text-primary capitalize">Total Amount</atoms-text>
              <atoms-text>IDR {{ $data.nominal || 0 }}</atoms-text>
            </div>
            <div class="space-y-1">
              <atoms-text caption strong class="!text-primary capitalize">Paid to</atoms-text>
              <n-card>
                <template #header>
                  <section class="flex items-center gap-5">
                    <atoms-avatar
                      v-if="!$breakpoint.smAndDown"
                      class="cursor-pointer"
                      :zoom="false"
                      sizes="50"
                    >
                      <template #none>
                        <n-space
                          class="bg-slate-100 w-[50px] h-[50px]"
                          justify="center"
                          align="center"
                        >
                          <atoms-icon flat name="wallet" class="!text-primary !mb-0" />
                        </n-space>
                      </template>
                    </atoms-avatar>
                    <div>
                      <atoms-text>
                        {{ $local.card?.bank?.title }} - **** ***
                        {{ $local.card?.card_number?.slice($local.card?.card_number?.length - 4) }}
                      </atoms-text>
                      <atoms-text caption>
                        ({{ $local.card?.card_holder || "-" }})&nbsp;{{
                          moment().format("DD MMMM YYYY")
                        }}
                      </atoms-text>
                    </div>
                  </section>
                </template>
                <template #header-extra>
                  <n-button type="warning" size="small" @click="$local.openCardChanger = true">
                    Change
                  </n-button>
                </template>
              </n-card>
            </div>
          </section>

          <br />
          <n-button
            :disabled="$local.cardLoading || $data.insufficient || !$data.local?.amount"
            type="primary"
            @click="$onSubmitWithdraw($data, $local.card)"
          >
            Submit Refund
          </n-button>
        </div>
      </template>
    </molecules-drawer>

    <!-- PAGE -->
    <atoms-container>
      <br />
      <atoms-heading h2>Refund</atoms-heading>
      <br />

      <n-card>
        <template #header>
          <section class="flex items-center gap-5">
            <atoms-avatar
              class="cursor-pointer ring-4 ring-primary"
              :src="$dataUser?.picture"
              :zoom="false"
              sizes="75"
              :nickname="$dataUser?.username || 'user'"
            />
            <div>
              <atoms-heading h5>{{ $dataUser?.username || "-" }}</atoms-heading>
              <atoms-text span>{{ $dataUser?.email || "-" }}</atoms-text>
            </div>
          </section>
        </template>
        <template #header-extra>
          <n-button
            type="primary"
            @click="
              () => {
                if (Number($local.balance?.amount || 0) < 100000) {
                  $notification.warning({
                    title: 'Minimum not met',
                    content: 'Your balance lower than minimum requirement (IDR 100.000).',
                  });
                  return;
                }
                if (!$local.card?.id) {
                  $notification.warning({
                    title: 'No card found',
                    content: 'Please add your bank account first.',
                  });
                  $local.openCardChanger = true;
                  return;
                }
                $local.openWithdrawal = true;
              }
            "
          >
            Request Refund
          </n-button>
        </template>

        <section class="space-y-2">
          <div>
            <atoms-text caption strong>Last refund</atoms-text>
            <atoms-text>{{ moment().format("DD MMMM YYYY, H:mm:ss") }}</atoms-text>
          </div>
          <div>
            <atoms-text caption strong>Balance Available</atoms-text>
            <atoms-heading h4>
              <atoms-icon :size="20" flat name="refresh" @click="$onFetchBalance" />
              {{
                $local.balanceLoading ? "..." : "IDR " + $addSeparator($local.balance?.amount || 0)
              }}
            </atoms-heading>
          </div>
        </section>
      </n-card>

      <n-divider title-placement="left">
        <atoms-text span>Card</atoms-text>
      </n-divider>

      <n-skeleton v-if="$local.cardLoading" type="card" height="100px" />
      <n-card v-else-if="$local.card?.id">
        <template #header>
          <section class="flex items-center gap-5">
            <atoms-avatar
              v-if="!$breakpoint.smAndDown"
              class="cursor-pointer"
              :zoom="false"
              sizes="50"
            >
              <template #none>
                <n-space class="bg-slate-100 w-[50px] h-[50px]" justify="center" align="center">
                  <atoms-icon flat name="wallet" class="!text-primary !mb-0" />
                </n-space>
              </template>
            </atoms-avatar>
            <div>
              <atoms-text>
                {{ $local.card.bank?.title }} - **** ***
                {{ $local.card?.card_number?.slice($local.card?.card_number?.length - 4) }}
              </atoms-text>
              <atoms-text caption>
                ({{ $local.card?.card_holder || "-" }})&nbsp;{{ moment().format("DD MMMM YYYY") }}
              </atoms-text>
            </div>
          </section>
        </template>
        <template #header-extra>
          <n-button type="warning" size="small" @click="$local.openCardChanger = true">
            Change
          </n-button>
        </template>
      </n-card>
      <atoms-empty v-else message="None of card been found" image="">
        <n-button type="primary" class="mt-2" @click="$local.openCardChanger = true"
          >Add now</n-button
        >
      </atoms-empty>

      <n-divider title-placement="left">
        <atoms-text span>History</atoms-text>
      </n-divider>

      <n-skeleton v-if="$local.mainLoading" type="card" height="100px" />
      <section v-else-if="$local.data?.length > 0" class="space-y-5">
        <n-card
          v-for="(_withdraw, _iwithdraw) in Array.apply([], $local.data).reverse()"
          :key="_iwithdraw"
          class="cursor-pointer"
          @click.stop="$local.openWithdrawalConfirmation = _withdraw"
        >
          <template #header>
            <section>
              <atoms-text class="!text-primary">Status : {{ _withdraw?.status || "" }}</atoms-text>
              <atoms-text caption>
                {{ moment(_withdraw?._created_date).format("DD MMMM YYYY, HH:mm") }}
              </atoms-text>
            </section>
          </template>
          <template #header-extra>
            <div class="flex items-center gap-1">
              <atoms-text span>IDR {{ $addSeparator(+(_withdraw.amount || 0)) }}</atoms-text>
              <atoms-icon flat name="chevron-right" :size="20" class="!mt-1"></atoms-icon>
            </div>
          </template>
        </n-card>

        <n-pagination
          class="flex flex-wrap gap-y-5"
          :disabled="$local.mainLoading"
          v-model:page="$local.page"
          :page-count="$local.raw?.pages || 1"
          @update:page="
            (_val) => {
              $onFetchWithdrawal({ page: _val });
            }
          "
        />
      </section>
      <atoms-empty v-else message="None of history been found" image=""> </atoms-empty>

      <br />
    </atoms-container>
  </div>
</template>
