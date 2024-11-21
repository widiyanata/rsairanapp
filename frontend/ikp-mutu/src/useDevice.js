import { ref, onMounted, onUnmounted } from "vue";

export function useDevice() {
  const isMobile = ref(false);

  const checkDevice = () => {
    isMobile.value = window.matchMedia("(max-width: 768px)").matches;
  };

  onMounted(() => {
    checkDevice();
    window.addEventListener("resize", checkDevice);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", checkDevice);
  });

  return { isMobile };
}
