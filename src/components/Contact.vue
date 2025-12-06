<script setup>
import { useConfig } from '@/composables/useConfig'
const { configs } = useConfig()
const config = configs.value

</script>

<template>
  <div class="contact-box">
    <a
      v-for="contact in config.contact"
      :key="contact.name"
      :href="contact.href"
      class="contact css-cursor-hover-enabled"
    >
      <img v-if="contact.imgSrc" :src="contact.imgSrc" alt="" />
      <i v-else-if="contact.iconfont" :class="['iconfont', contact.iconfont]" />
      <span>{{ contact.name }}</span>
    </a>
  </div>
</template>

<style scoped>
.contact-box {
  position: absolute;
  left: 20px;
  top: 186px;
  display: grid;
  grid-template-columns: repeat(2, 130px);
  grid-gap: 20px;
  height: auto;
  justify-items: center;
}

.contact {
  height: max-content;
  width: fit-content;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  position: relative;
  bottom: 15px;
  margin: 0 20px;
  transition: transform 0.05s;
}

.contact span {
  margin: 5px 0 0;
  font-size: 20px;
  color: #003153;
  font-weight: 700;
}

.contact span {
  text-shadow:
    #fff 1px 0 0,
    #fff 0 1px 0,
    #fff -1px 0 0,
    #fff 0 -1px 0;
}

.arco-icon {
  font-size: 48px;
  filter: drop-shadow(0px 0px 4px #fff6);
}

/* 图片和字体图标统一大小和阴影效果 */
.contact img,
.contact .iconfont {
  width: 48px;           /* 图片宽度 */
  height: 48px;          /* 图片高度 */
  font-size: 48px;       /* 字体图标大小 */
  line-height: 48px;     /* 字体垂直居中 */
  filter: drop-shadow(0 0 4px #fff6);
  display: inline-block;
  text-align: center;
}

.contact:active {
  transform: scale(0.9);
}

@media screen and (max-width: 495px) {
  .contact-box {
    grid-template-columns: repeat(2, 100px);
    grid-gap: 20px;
  }
}

@media screen and (max-width: 375px) {
  .contact-box {
    grid-template-columns: repeat(2, 75px);
    grid-gap: 15px;
  }
}
</style>
