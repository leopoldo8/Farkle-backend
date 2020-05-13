export const formatMilliseconds = (milliseconds: number) => [(milliseconds / 100) / 3600, (milliseconds / 100) / 60 % 60, (milliseconds / 100) % 60].map(time => time.toString().padStart(2, '0')).join(':');

export const hoursToMilliseconds = (hours: number) => hours * 3.6 * Math.pow(10, 6);

export const formatedToMilliseconds = (formatedString: string) => {
  const arr = formatedString.split(':');
  const seconds = (+arr[0]) * 60 * 60 + (+arr[1]) * 60 + (+arr[2]);
  return seconds * 1000;
}
