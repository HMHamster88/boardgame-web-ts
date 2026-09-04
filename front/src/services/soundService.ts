import notificationSound from '../assets/sounds/notification.mp3';
import { useLocalStore } from '../services/localStore';



export const soundService = {
    playSound(src: string) {
        const localStore = useLocalStore();
        if (localStore.settings.soundsVolume != 0) {
            const audio = new Audio(src)
            audio.volume = localStore.settings.soundsVolume
            audio.play()
        }
    },

    vibrate(vibrationPattern: VibratePattern = 200) {
        if ("vibrate" in navigator) {
            const localStore = useLocalStore();
            if (localStore.settings.vibration) {
                navigator.vibrate(vibrationPattern);
            }
        }
    },

    notification() {
        this.playSound(notificationSound)
    }
}