import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useOsTheme, lightTheme, darkTheme, createDiscreteApi } from 'naive-ui'
import { useBreakpoint } from 'vooks'

const THEME_AUTO = 'auto'

export default defineStore(
  'naive',
  () => {
    const theme = ref(THEME_AUTO),
      theme_os = useOsTheme(),
      theme_name = computed(() => (theme.value == THEME_AUTO ? theme_os.value : theme.value)),
      getTheme = computed(() => (theme_name.value == 'light' ? lightTheme : darkTheme)),
      changeTheme = (value: string) => (theme.value = value),
      triggerTheme = () => changeTheme(theme_name.value == 'light' ? 'dark' : 'light')

    const { message, notification, dialog, loadingBar } = createDiscreteApi(['message', 'dialog', 'notification', 'loadingBar'], {
      configProviderProps: computed(() => ({
        theme: getTheme.value,
      })),
    })

    const use_break_point = useBreakpoint(),
      is_mobile = computed(() => use_break_point.value == 'xs'),
      is_tablet = computed(() => use_break_point.value == 's')

    return {
      theme,
      theme_os,
      theme_name,
      getTheme,
      changeTheme,
      triggerTheme,

      message,
      notification,
      dialog,
      loadingBar,

      is_mobile,
      is_tablet,
    }
  },
  {
    persist: {
      paths: ['theme'],
    },
  },
)
