<script setup>
import { NDivider } from "naive-ui";
</script>
<template>
  <footer class="bg-white-smoke dark:bg-black">
    <atoms-container class="py-10">
      <br />
      <section class="grid md:grid-cols-3 gap-y-5">
        <div class="col-span-1 space-y-5">
          <div class="flex gap-2 items-center">
            <atoms-image src="/favicon.ico" height="30" :zoom="false" />
            <atoms-text to="/" strong class="!no-underline">Lombok Halal Room</atoms-text>
          </div>
          <atoms-text span>
            Lombok Halal Room stands as an exclusive travel application, uniquely tailored to cater
            to Muslim-friendly destinations exclusively within the captivating realm of Lombok. As a
            specialized platform, it seamlessly connects travelers with accommodations that
            meticulously align with Islamic principles.
          </atoms-text>
        </div>
        <div class="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-y-5 md:justify-items-end">
          <div class="col-span-1">
            <atoms-text strong class="!text-primary">Company</atoms-text>
            <br />
            <div class="flex flex-wrap gap-5 md:flex-col">
              <atoms-text span>About</atoms-text>
              <atoms-text span>Career</atoms-text>
              <atoms-text span>Mobile</atoms-text>
            </div>
          </div>
          <div class="col-span-1">
            <atoms-text strong class="!text-primary">Contact</atoms-text>
            <br />
            <div class="flex flex-wrap gap-5 md:flex-col">
              <atoms-text span>Why choosing us?</atoms-text>
              <atoms-text span>Partner with us</atoms-text>
              <atoms-text span>FAQ's</atoms-text>
              <atoms-text span>Blog</atoms-text>
            </div>
          </div>
          <div class="col-span-1">
            <atoms-text strong class="!text-primary">Contact Us</atoms-text>
            <br />
            <div class="flex flex-wrap gap-5 md:flex-col">
              <atoms-text span>+62 87218732</atoms-text>
              <atoms-text span>info@lombokhalalroom.com</atoms-text>
              <atoms-text span>Mataram, West Nusa Tenggara</atoms-text>
              <atoms-text span>Indonesia</atoms-text>
            </div>
          </div>
        </div>
      </section>
      <br />

      <n-divider></n-divider>
      <div class="flex justify-between gap-2 items-center">
        <atoms-text caption>🇮🇩 lombokhalalroom.com</atoms-text>
        <atoms-text caption>Copyright © 2023 </atoms-text>
      </div>
    </atoms-container>
    <br />
    <br />
  </footer>
</template>
