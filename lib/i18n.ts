import { Locale } from "@/types";

export const dictionary = {
  tr: {
    brand: "MY BRAND",
    menu: "MENÜ",
    categories: "KATEGORİLER",
    home: "Ana Sayfa",
    about: "Hakkımızda",
    shop: "Mağaza",
    contact: "İletişim",
    favorites: "Favoriler",
    compare: "Karşılaştır",
    login: "Giriş / Kayıt",
    search: "Ürünleri ara",
    cart: "Sepet",
    account: "Hesabım",
    heroTitle: "MY BRAND'A HOŞGELDİNİZ",
    heroSubtitle:
      "Şıklığı, konforu ve kaliteyi bir arada sunan mobilyalarla yaşam alanlarınızı dönüştürün.",
    heroButton: "İletişim",
    marquee: "Özel Ürünler ★ Yeni Sezon İndirimleri ★ ",
    featuresTitle: "ÜRÜNLERİMİZ",
    featuresSubtitle:
      "Zarif tasarımlar ve yüksek kaliteli materyallerle, her ihtiyaca uygun mobilyalar sunuyoruz.",
    feature1Title: "Kolay Ödeme Seçenekleri",
    feature1Desc:
      "Siparişinizin yarısı ön ödeme, kalan tutarı ise teslimat sırasında ödeme imkanı.",
    feature2Title: "Ürün Güvencesi",
    feature2Desc: "Ürünlerimiz 2 yıl süreyle garanti kapsamındadır.",
    feature3Title: "Teslimat Montaj",
    feature3Desc: "Ekibimiz tarafından ücretsiz kurulum ve montaj hizmeti.",
    productsTitle: "Ürünlerimiz",
    productsSubtitle:
      "Her zevke ve ihtiyaca uygun, şıklığı ve konforu bir arada sunduğumuz özel koleksiyonumuzu keşfedin.",
    addToCart: "Sepete Ekle",
    aboutTitle: "Hakkımızda",
    aboutText:
      "MY BRAND, şık ve konforlu evleriniz için özenle tasarlanmış mobilya takımları sunar.",
    contactTitle: "İletişim",
    formName: "Ad Soyad",
    formPhone: "Telefon",
    formMessage: "Mesajınız",
    formSubmit: "Gönder",
    footerText:
      "MY BRAND, şık ve konforlu evleriniz için özenle tasarlanmış mobilya takımları sunar.",
    salesAgreement: "Mesafeli Satış Sözleşmesi",
    returnPolicy: "İptal & İade",
    privacy: "Gizlilik Politikası",
    address: "Adres, Şehir, Ülke",
  },
  en: {
    brand: "MY BRAND",
    menu: "MENU",
    categories: "CATEGORIES",
    home: "Home",
    about: "About Us",
    shop: "Shop",
    contact: "Contact",
    favorites: "Favorites",
    compare: "Compare",
    login: "Login / Register",
    search: "Search products",
    cart: "Cart",
    account: "My Account",
    heroTitle: "WELCOME TO MY BRAND",
    heroSubtitle:
      "Transform your living spaces with furniture that combines style, comfort, and quality.",
    heroButton: "Contact Us",
    marquee: "Featured Products ★ New Season Discounts ★ ",
    featuresTitle: "OUR PRODUCTS",
    featuresSubtitle:
      "We offer furniture for every need with elegant designs and high-quality materials.",
    feature1Title: "Easy Payment Options",
    feature1Desc:
      "Pay half of your order in advance, and the remaining amount upon delivery.",
    feature2Title: "Product Warranty",
    feature2Desc: "Our products are covered by a 2-year warranty.",
    feature3Title: "Delivery & Assembly",
    feature3Desc: "Free installation and assembly service by our team.",
    productsTitle: "Our Products",
    productsSubtitle:
      "Discover our exclusive collection that combines style and comfort for every taste and need.",
    addToCart: "Add to Cart",
    aboutTitle: "About Us",
    aboutText:
      "MY BRAND offers furniture sets carefully designed for your stylish and comfortable homes.",
    contactTitle: "Contact",
    formName: "Full Name",
    formPhone: "Phone",
    formMessage: "Your Message",
    formSubmit: "Send",
    footerText:
      "MY BRAND offers furniture sets carefully designed for your stylish and comfortable homes.",
    salesAgreement: "Distance Sales Agreement",
    returnPolicy: "Cancellation & Return",
    privacy: "Privacy Policy",
    address: "Address, City, Country",
  },
};

export function t(locale: Locale, key: keyof typeof dictionary["tr"]) {
  return dictionary[locale][key];
}
