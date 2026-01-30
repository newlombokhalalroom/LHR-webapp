export default function () {
  const _nuxtApp = useNuxtApp();

  const _screens = reactive({
    sm: 600,
    md: 728,
    lg: 984,
    xl: 1240,
    xxl: 1280,
  });

  const _type = {
    smAndDown: "smAndDown",
    mdAndDown: "mdAndDown",
  };

  const sm = (_val: any) => _val >= _screens.sm && _val <= _screens.md;
  const md = (_val: any) => _val >= _screens.md && _val <= _screens.lg;
  const lg = (_val: any) => _val >= _screens.lg && _val <= _screens.xl;
  const xl = (_val: any) => _val >= _screens.xl && _val <= _screens.xxl;
  const xxl = (_val: any) => _val >= _screens.xxl;
  const smAndDown = (_val: any) => _val <= _screens.sm;
  const mdAndDown = (_val: any) => _val <= _screens.md;

  const $getBreakpoint = (w: any) => {
    if (sm(w)) return "sm";
    else if (md(w)) return "md";
    else if (lg(w)) return "lg";
    else if (xl(w)) return "xl";
    else if (xxl(w)) return "xxl";
    else return "all";
  };

  const _breakpoint = reactive({
    w: 0,
    h: 0,
    is: $getBreakpoint(0),
    smAndDown: true,
    mdAndDown: true,
  });

  const $onChange = () => {
    if (window) {
      _breakpoint.w = window?.innerWidth;
      _breakpoint.h = window?.innerHeight;
      _breakpoint.is = $getBreakpoint(window?.innerWidth);
      _breakpoint.smAndDown = smAndDown(window?.innerWidth) || false;
      _breakpoint.mdAndDown = mdAndDown(window?.innerWidth) || false;
    } else {
      _breakpoint.w = 0;
      _breakpoint.h = 0;
      _breakpoint.is = $getBreakpoint(0);
      _breakpoint.smAndDown = true;
      _breakpoint.mdAndDown = true;
    }
  };

  onMounted(() => {
    $onChange();
    window.addEventListener("resize", $onChange);
  });

  return _breakpoint;
}
