import { requireAdmin } from "@/lib/auth";
import { updateSiteSettings } from "@/lib/actions/site-settings";
import { getSiteSettings } from "@/lib/data/settings";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Textarea,
} from "@/components/admin/ui";
import { DeliveryBandsEditor } from "@/components/admin/DeliveryBandsEditor";
import { DeliveryDistrictsEditor } from "@/components/admin/DeliveryDistrictsEditor";
import { DeliveryZonesEditor } from "@/components/admin/DeliveryZonesEditor";

export default async function AdminSettingsPage() {
  await requireAdmin();
  /** Same source as the storefront + defaults when no DB row (see `lib/data/settings.ts`). */
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Налаштування сайту"
        description="Контактні дані, адреси, текст банера та головна картинка."
      />

      <form action={updateSiteSettings} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Контакти"
              description="Показуються в футері, контактах і листах."
            />
            <CardBody className="space-y-4">
              <Field label="Телефон">
                <Input
                  name="phone"
                  defaultValue={settings.phone ?? ""}
                  placeholder="+380 …"
                />
              </Field>
              <Field label="Email">
                <Input
                  name="email"
                  type="email"
                  defaultValue={settings.email ?? ""}
                  placeholder="hello@floret.ua"
                />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Адреса самовивозу"
              description="Показується на сторінці оформлення замовлення."
            />
            <CardBody className="space-y-4">
              <Field label="Адреса (UK)">
                <Textarea
                  name="pickup_address_uk"
                  rows={2}
                  defaultValue={settings.pickup_address_uk ?? ""}
                />
              </Field>
              <Field label="Address (EN)">
                <Textarea
                  name="pickup_address_en"
                  rows={2}
                  defaultValue={settings.pickup_address_en ?? ""}
                />
              </Field>
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title="Банер і головне зображення"
              description="Рядок банера показується на сайті, якщо заповнено. Hero — URL картинки для першого екрану головної."
            />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Банер (UK)">
                <Input
                  name="announcement_uk"
                  defaultValue={settings.announcement_uk ?? ""}
                />
              </Field>
              <Field label="Banner (EN)">
                <Input
                  name="announcement_en"
                  defaultValue={settings.announcement_en ?? ""}
                />
              </Field>
              <Field label="Hero image URL" className="sm:col-span-2">
                <Input
                  name="hero_image_url"
                  defaultValue={settings.hero_image_url ?? ""}
                  placeholder="https://…"
                />
              </Field>
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title="Короткий текст «Про нас»"
              description="Показується на головній, одразу під героєм."
            />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Коротко про нас (UK)">
                <Textarea
                  name="about_short_uk"
                  rows={4}
                  defaultValue={settings.about_short_uk ?? ""}
                />
              </Field>
              <Field label="About short (EN)">
                <Textarea
                  name="about_short_en"
                  rows={4}
                  defaultValue={settings.about_short_en ?? ""}
                />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Доставка"
              description="Час прийому замовлень на сьогодні та кінець вікна доставки."
            />
            <CardBody className="space-y-4">
              <Field
                label="Останній час прийому замовлення на доставку «сьогодні»"
                hint="Формат HH:MM (наприклад 18:10). Після цього дата «сьогодні» недоступна для нових замовлень."
              >
                <Input
                  name="same_day_cutoff_time"
                  defaultValue={
                    settings.same_day_cutoff_time
                      ? String(settings.same_day_cutoff_time).slice(0, 5)
                      : "18:10"
                  }
                  placeholder="18:10"
                />
              </Field>
              <Field
                label="Кінець інтервалу доставки «сьогодні»"
                hint="Формат HH:MM (наприклад 19:00). Показується клієнту як орієнтир; вечірній слот узгоджуйте з графіком."
              >
                <Input
                  name="same_day_delivery_end_time"
                  defaultValue={
                    settings.same_day_delivery_end_time
                      ? String(settings.same_day_delivery_end_time).slice(0, 5)
                      : "19:00"
                  }
                  placeholder="19:00"
                />
              </Field>
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title="Зони доставки (назва + ціна)"
              description="Картки на оформленні замовлення. Якщо порожньо — використовуються вбудовані зони Полтави (поки не задані райони за часом і не заповнені км)."
            />
            <CardBody>
              <DeliveryZonesEditor
                initialZones={settings.delivery_pricing?.zones ?? []}
              />
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title="Орієнтовна доставка за відстанню"
              description="Показується клієнту при виборі доставки. Фінальну суму узгоджуйте окремо (таксі)."
            />
            <CardBody>
              <DeliveryBandsEditor
                initialBands={settings.delivery_pricing?.bands ?? []}
              />
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title="Доставка за районом і часом (UAH)"
              description="Якщо заповнено, клієнт обирає район і інтервал (ранок / день / вечір) — сума доставки додається до оплати. Для EUR залиште порожнім."
            />
            <CardBody>
              <DeliveryDistrictsEditor
                initialDistricts={settings.delivery_pricing?.districts ?? []}
              />
            </CardBody>
          </Card>
        </div>

        <div className="sticky bottom-4 z-10 flex items-center justify-end rounded-xl border border-zinc-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
          <Button type="submit">Зберегти зміни</Button>
        </div>
      </form>
    </div>
  );
}
