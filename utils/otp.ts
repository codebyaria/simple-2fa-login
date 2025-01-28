export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getExpiryTime = () => {
    const date = new Date()
    date.setMinutes(date.getMinutes() + 10) // 10 minutes expiry
    return date.toISOString()
}