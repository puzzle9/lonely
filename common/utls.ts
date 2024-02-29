const sleep = (second = 1000): Promise<void> =>
  new Promise((resolve) =>
    setTimeout(() => {
      resolve()
    }, second),
  )
