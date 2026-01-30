import { useUserStore } from "@/store/user";

export default defineNuxtRouteMiddleware((to, from) => {
  const $userStore = useUserStore();
  const $scope = $userStore.getScope;
  const $target = `/${$scope || ""}`;

  // if (!to?.fullPath?.includes($scope) && to?.fullPath != $target && from?.fullPath != $target) {
  //   return navigateTo($target);
  // }
});
