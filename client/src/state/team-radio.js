export function filterTeamRadioMessages(messages = [], selectedDrivers = []) {
  if (!selectedDrivers.length) return messages;
  const selected = new Set(selectedDrivers.map(String));
  return messages.filter((message) => selected.has(String(message.driverId)));
}

export function toggleRadioDriver(selectedDrivers = [], driverId) {
  const id = String(driverId);
  return selectedDrivers.some((value) => String(value) === id)
    ? selectedDrivers.filter((value) => String(value) !== id)
    : [...selectedDrivers, driverId];
}
