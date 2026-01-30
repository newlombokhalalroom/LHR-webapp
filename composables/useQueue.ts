export default function () {
  const $local = reactive<any>({
    queue: null,
    mainLoading: false,
  });

  const $resetQueue = (_payload: any) => {
    $local.queue = null;
  };

  const $setQueueLoading = (_payload: any) => {
    $local.mainLoading = Boolean(_payload);
  };

  const $pushToQueue = (_payload: any) => {
    if (!$local.queue) {
      $local.queue = [_payload];
    } else {
      $local.queue = [...$local.queue, _payload];
    }
  };

  watch([() => $local.queue], async () => {
    try {
      if (!$local.mainLoading && $local.queue?.length > 0) {
        for (let i = 0; i < $local.queue?.length; i++) {
          const _queue_item = $local.queue[i];
          if (typeof _queue_item == "function") {
            await _queue_item();
            $local.queue[i] = undefined;
          }
        }
        // $local.queue = null
        $local.queue = $local.queue?.filter((_que: any) => !!_que && typeof _que == "function");
      }
    } catch (error: any) {
      throw error;
    }
  });

  return reactive({
    $queue: $local.queue,
    $pushToQueue,
  });
}
