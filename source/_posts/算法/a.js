const binarySearch = (arr, target) => {
  let left = 0;
  let right = arr.length - 1;
  
  while(left <= right) {
    let middle = Math.floor((left + right) / 2);
    if(target === arr[middle]) return middle;

    if(target > arr[middle]) {
      left = middle;
    }else {
      right = middle;
    }
  }
  return -1;
}

const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
console.log(binarySearch(arr, 10))  // 9