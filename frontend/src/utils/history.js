export const getHistoryItems = () => {
  try {
    const userStr = localStorage.getItem('user');
    const userId = userStr ? JSON.parse(userStr).id || 'anonymous' : 'anonymous';
    return JSON.parse(localStorage.getItem(`cloud_architecture_history_${userId}`) || '[]');
  } catch (err) {
    console.error("Error getting history:", err);
    return [];
  }
};

export const saveHistoryItem = (item) => {
  try {
    const userStr = localStorage.getItem('user');
    const userId = userStr ? JSON.parse(userStr).id || 'anonymous' : 'anonymous';
    const history = JSON.parse(localStorage.getItem(`cloud_architecture_history_${userId}`) || '[]');
    const newHistory = [
      {
        id: Date.now(),
        ...item,
        date: new Date().toISOString()
      },
      ...history
    ];
    localStorage.setItem(`cloud_architecture_history_${userId}`, JSON.stringify(newHistory));
  } catch (err) {
    console.error("Error saving history:", err);
  }
};

