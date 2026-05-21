/** Контакты магазина (страница /contacts и ссылки на карту). */

export const STORE_ADDRESS = "Мытищи, Коммунистическая 23";

export const STORE_PHONE = "+7 (999) 900-19-10";

export const STORE_PHONE_HREF = "tel:+79999001910";

export const STORE_EMAIL = "info@gde-fazan.ru";

export const STORE_EMAIL_HREF = "mailto:info@gde-fazan.ru";

/** Поиск по адресу в виджете и в приложении Яндекс.Карт. */
export const YANDEX_MAPS_QUERY = encodeURIComponent(STORE_ADDRESS);

export const YANDEX_MAP_WIDGET_SRC = `https://yandex.ru/map-widget/v1/?text=${YANDEX_MAPS_QUERY}&z=17`;

export const YANDEX_MAPS_OPEN_URL = `https://yandex.ru/maps/?text=${YANDEX_MAPS_QUERY}`;
