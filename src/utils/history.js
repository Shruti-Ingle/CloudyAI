export const saveHistoryItem = (item) => {
  try {
    const history = JSON.parse(localStorage.getItem('cloud_architecture_history') || '[]');
    const newHistory = [
      {
        id: Date.now(),
        ...item,
        date: new Date().toISOString()
      },
      ...history
    ];
    localStorage.setItem('cloud_architecture_history', JSON.stringify(newHistory));
  } catch (err) {
    console.error("Error saving history:", err);
  }
};

export const getHistoryItems = () => {
  try {
    return JSON.parse(localStorage.getItem('cloud_architecture_history') || '[]');
  } catch (err) {
    console.error("Error getting history:", err);
    return [];
  }
};
