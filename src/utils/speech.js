export function speakArabic(text) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'ar-SA'
  utter.rate = 0.85
  const voices = window.speechSynthesis.getVoices()
  const arVoice = voices.find((v) => v.lang?.startsWith('ar'))
  if (arVoice) utter.voice = arVoice
  window.speechSynthesis.speak(utter)
}
