<script setup>
import {
  NCard,
  NButton,
  NAlert,
  NForm,
  NSwitch,
  NDivider,
  useMessage,
  NPagination,
  useLoadingBar,
  NSkeleton,
  NCollapseTransition,
  useNotification,
} from "naive-ui";
import { useVuelidate } from "@vuelidate/core";
import { required, minLength, helpers } from "@vuelidate/validators";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";
import moment from "moment";

const router = useRouter();
const route = useRoute();
const $loadingBar = useLoadingBar();
const { $createError } = useError();
const { $uploadFile } = useNuxtApp();
const $breakpoint = useBreakpoint();
const $notification = useNotification();
const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);

const $local = reactive({
  isEdit: false,
  openProfilePictureEditor: false,
});

const $model = reactive({
  pastPassword: null,
  password: null,
  confirmPassword: null,
});

const $form = useVuelidate(
  {
    pastPassword: {
      required,
      minLength: helpers.withMessage(() => `Minimum has 8 characters `, minLength(8)),
    },
    password: {
      required,
      minLength: helpers.withMessage(() => `Minimum has 8 characters `, minLength(8)),
    },
    confirmPassword: {
      custom: helpers.withMessage(
        () => `Password does not match`,
        (_value) => (_value && _value == $model.password) || false
      ),
    },
  },
  $model
);

const $isLoading = computed(() => $local.mainLoading || false);

const $onSubmit = async (e, targetPath, payload) => {
  e?.preventDefault();
  $local.mainLoading = true;
  try {
    if ((!(await $form.value.$validate()) || !targetPath) && targetPath?.includes("password")) {
      throw new Error("Please make sure the fields were filled");
    }
    // console.log(targetPath, payload);
    await $userStore.put(targetPath, payload);

    $form.value.$reset();
    $local.errors = null;

    if (targetPath?.includes("password")) {
      $notification.success({
        title: "Status",
        content: "Your password was successfully changed",
      });
      await $userStore.logout();
      location.href = "/";
    } else {
      $notification.success({
        title: "Status",
        content: "Your account was successfully updated",
      });
      await $userStore.refresh();
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $uploadProfilePicture = async (_payload) => {
  $local.mainLoading = true;
  try {
    const _picture = await $uploadFile(
      _payload.rawSource,
      `users/${$dataUser.value?.id}`,
      "picture"
    );

    await $onSubmit(null, "picture", {
      url: _picture,
    });
  } finally {
    $local.mainLoading = false;
  }
};

definePageMeta({
  validation: ({ _user }) => {
    if (!_user?.id) return "/";
  },
});
</script>

<template>
  <atoms-container>
    <molecules-modal
      title="Profile Picture Uploader"
      v-model:show="$local.openProfilePictureEditor"
      :style="{
        width: $breakpoint.mdAndDown ? '90%' : '600px',
      }"
      @closed="
        (_val) => {
          if (_val?.[0]) {
            $uploadProfilePicture(_val?.[0]);
            // $model.pictures = [...($model.pictures || []), ...(_val || [])];
          }
          $local.openProfilePictureEditor = false;
        }
      "
    >
      <molecules-image-editor
        :camera="{
          disabled: true,
        }"
        :max="1"
      />
    </molecules-modal>
    <br />
    <n-card title="Your Profile Settings">
      <template #header-extra>
        <n-button type="primary" @click="$local.isEdit = !$local.isEdit">{{
          $local.isEdit ? "Show Profile" : "Change Password"
        }}</n-button>
      </template>

      <n-collapse-transition v-show="$local.isEdit">
        <div>
          <n-alert type="info">
            <atoms-text caption
              >You will directly logging out from the app! Please make sure the password you changed
              was correct</atoms-text
            >
          </n-alert>
          <n-alert v-if="$local.errors" type="error" class="mt-5">
            {{ $local.errors }}
          </n-alert>
          <br />
          <n-form
            @submit="
              (e) =>
                $onSubmit(e, 'password', {
                  oldPassword: $model.pastPassword,
                  newPassword: $model.password,
                })
            "
          >
            <atoms-input
              path="password"
              label="Password"
              type="password"
              show-password-on="click"
              v-model:value="$model.pastPassword"
              placeholder="Old Password"
              :isError="$form.pastPassword.$error"
              :errors="$form.pastPassword.$errors"
              :disabled="$isLoading"
            />
            <atoms-input
              path="password"
              label="Password"
              type="password"
              show-password-on="click"
              v-model:value="$model.password"
              placeholder="New Password"
              :isError="$form.password.$error"
              :errors="$form.password.$errors"
              :disabled="$isLoading"
            />
            <atoms-input
              path="confirm-password"
              label="Confirm password"
              type="password"
              show-password-on="click"
              v-model:value="$model.confirmPassword"
              placeholder="Confirm your passwor"
              :isError="$form.confirmPassword.$error"
              :errors="$form.confirmPassword.$errors"
              :disabled="$isLoading"
            />

            <n-button :disabled="$isLoading" class="fullWidth" type="primary" attrType="submit"
              >Change Password</n-button
            >
          </n-form>
        </div>
      </n-collapse-transition>
      <n-collapse-transition v-show="!$local.isEdit">
        <div class="flex gap-10 md:space-y-0">
          <!-- <atoms-image-native
            class="md:col-span-3 bg-white-smoke rounded-sm min-h-[250px]"
            :src="$dataUser?.picture"
          /> -->
          <div class="">
            <atoms-avatar
              ref="$refPicture"
              class="cursor-pointer dark:!bg-black bg-white"
              :src="$dataUser?.picture"
              sizes="200"
              nickname="account"
            >
              <div
                class="absolute flex flex-col items-center justify-center w-full h-full gap-2 bg-black bg-opacity-25"
              >
                <n-button size="tiny" type="primary" @click="$local.openProfilePictureEditor = true"
                  >Update Picture</n-button
                >
              </div>
            </atoms-avatar>
          </div>
          <div class="space-y-1 md:col-span-9">
            <div>
              <atoms-text caption class="!text-primary">Your name</atoms-text>
              <atoms-text class="capitalize">
                {{ $dataUser?.username }}
              </atoms-text>
              <!-- <atoms-editable-text
                disabled
                :value="$dataUser?.username"
                @submit="
                  (payload) => {
                    if (payload) {
                      $onSubmit(null, null, {
                        username: $trim(payload),
                      });
                    }
                  }
                "
              >
                <template #text
                  ><atoms-text class="capitalize">
                    {{ $dataUser?.username }}
                  </atoms-text></template
                > 
              </atoms-editable-text>
              -->
            </div>
            <!-- <div>
              <atoms-text caption class="!text-primary">Your Email</atoms-text>
              <atoms-text>{{ $dataUser }}</atoms-text>
            </div> -->
            <div>
              <atoms-text caption class="!text-primary">Status Account</atoms-text>
              <atoms-text>User</atoms-text>
            </div>
            <div>
              <atoms-text caption class="!text-primary">Joined Date </atoms-text>
              <atoms-text>{{ moment($dataUser?._createdDate).format("DD MMMM YYYY") }}</atoms-text>
            </div>
          </div>
        </div>
      </n-collapse-transition>
    </n-card>
    <br />
  </atoms-container>
</template>
