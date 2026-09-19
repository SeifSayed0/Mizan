import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Compass,
  EyeOff,
  Heart,
  Home as HomeIcon,
  LayoutGrid,
  LockKeyhole,
  Menu,
  MessageCircle,
  Mic2,
  MoreHorizontal,
  Plane,
  Plus,
  Search,
  Scale,
  Send,
  Share2,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const categories: { label: string; icon: LucideIcon; color: string }[] = [
  { label: "الكل", icon: LayoutGrid, color: "#197862" },
  { label: "علاقات", icon: Heart, color: "#d85b68" },
  { label: "دراسة", icon: Compass, color: "#6c71d7" },
  { label: "شغل", icon: BriefcaseBusiness, color: "#c58c41" },
  { label: "فلوس", icon: TrendingUp, color: "#4e9b84" },
  { label: "شراء", icon: ShoppingBag, color: "#ca7568" },
  { label: "سفر", icon: Plane, color: "#538fb2" },
  { label: "حياة شخصية", icon: HomeIcon, color: "#8476c0" },
];

const decisions = [
  {
    id: "leave-job",
    title: "هل أسيب شغلي وأسافر؟",
    category: "شغل",
    categoryColor: "#c58c41",
    image: "linear-gradient(135deg, #d8e9e4 0%, #4e9486 100%)",
    optionA: "أسيب",
    optionB: "أستمر",
    percentA: 62,
    votes: 184,
    time: "منذ ٣ ساعات",
    author: "أحمد م.",
    tag: "تجربة مشابهة",
  },
  {
    id: "laptop",
    title: "أشتري اللابتوب ده ولا أستنى؟",
    category: "شراء",
    categoryColor: "#ca7568",
    image: "linear-gradient(135deg, #d9d8d2 0%, #767d83 100%)",
    optionA: "أشتري",
    optionB: "أستنى",
    percentA: 71,
    votes: 96,
    time: "منذ ٦ ساعات",
    author: "نور ي.",
    tag: "قرار شراء",
  },
  {
    id: "ex",
    title: "أرجع أكلم الشخص ده؟",
    category: "علاقات",
    categoryColor: "#d85b68",
    image: "linear-gradient(135deg, #f2b586 0%, #5b4a5a 100%)",
    optionA: "أكلمه",
    optionB: "ما أكلموش",
    percentA: 68,
    votes: 247,
    time: "منذ يوم",
    author: "سارة ع.",
    tag: "أكثر نقاشاً",
  },
  {
    id: "college",
    title: "أختار كلية إيه؟",
    category: "دراسة",
    categoryColor: "#6c71d7",
    image: "linear-gradient(135deg, #d8b477 0%, #71658b 100%)",
    optionA: "أبدأ الآن",
    optionB: "أستنى سنة",
    percentA: 54,
    votes: 42,
    time: "منذ يومين",
    author: "يوسف ر.",
    tag: "تجربة مشابهة",
  },
  {
    id: "family",
    title: "أقول لأهلي الحقيقة ولا لأ؟",
    category: "حياة شخصية",
    categoryColor: "#8476c0",
    image: "linear-gradient(135deg, #d7b084 0%, #496466 100%)",
    optionA: "أقول",
    optionB: "أستنى",
    percentA: 37,
    votes: 89,
    time: "منذ ٣ أيام",
    author: "مي ر.",
    tag: "مجهول للناس",
  },
];

const experiences = [
  {
    name: "سلمى أحمد",
    initials: "س",
    accent: "#e9b5ab",
    meta: "قبل ٦ أشهر · ٣١ سنة",
    title: "رجعت أكلمه… وده اللي حصل",
    body: "لو كنت في نفس الموقف، اسأل نفسك الأول: هل المشكلة اتحلت فعلًا؟ أنا رجعت بعد فترة، ونجح الموضوع لأننا اتكلمنا بصدق عن السبب الحقيقي.",
    type: "نجحت",
    likes: 312,
    comments: 48,
  },
  {
    name: "عمر فؤاد",
    initials: "ع",
    accent: "#a9c3d0",
    meta: "منذ سنة · ٢٨ سنة",
    title: "استنيت شوية قبل القرار",
    body: "أحيانًا الاشتياق بيخلينا نشوف الصورة ناقصة. خدت وقتي وركزت على نفسي، وبعدها عرفت إن الاستمرار مش دايمًا معناه إننا صح.",
    type: "فشلت",
    likes: 167,
    comments: 26,
  },
];

const notifications = [
  { icon: ThumbsUp, title: "حد صوّت على قرارك", body: "أحمد حسن اختار: أستمر", time: "منذ ١٠ دقائق", tone: "mint" },
  { icon: MessageCircle, title: "تعليق جديد على قرارك", body: "تشرفت بتجربتك، هل جربت...", time: "منذ ٤٥ دقيقة", tone: "sand" },
  { icon: BadgeCheck, title: "تجربتك كانت مفيدة", body: "حصلت تجربتك على ١٢ علامة مفيدة", time: "أمس", tone: "lavender" },
  { icon: UsersRound, title: "مستخدم جديد تابع قرارك", body: "نور انضمت لمتابعي هذا القرار", time: "منذ يومين", tone: "rose" },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none" dir="rtl">
      <div className="logo-mark" aria-hidden="true">
        <Scale size={compact ? 21 : 25} strokeWidth={1.8} />
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-[25px] font-extrabold tracking-[-0.06em] text-[#073c36]">مِيزان</div>
          <div className="mt-1 text-[9px] font-semibold tracking-[0.2em] text-[#7b9890]">شوف ناس عاشته</div>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4" dir="rtl">
      <div>
        {eyebrow && <div className="mb-2 text-[11px] font-bold tracking-[0.14em] text-[#197862]">{eyebrow}</div>}
        <h2 className="font-display text-[24px] font-bold tracking-[-0.04em] text-[#0b3934] sm:text-[28px]">{title}</h2>
      </div>
      {action && (
        <button onClick={onAction} className="group mb-1 flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#197862] transition-colors hover:text-[#0b3934]">
          {action}
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
        </button>
      )}
    </div>
  );
}

function Header({ currentPath, onNavigate, onOpenCreate }: { currentPath: string; onNavigate: (path: string) => void; onOpenCreate: () => void }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const navItems = [
    { label: "الرئيسية", path: "/", icon: HomeIcon },
    { label: "استكشف", path: "/explore", icon: Compass },
    { label: "تجاربي", path: "/profile", icon: UserRound },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[#e7ece7]/80 bg-[#fbfcf8]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8" dir="rtl">
        <div className="flex items-center gap-7">
          <button onClick={() => onNavigate("/")} aria-label="الرئيسية"><Logo /></button>
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentPath === item.path;
              return (
                <button key={item.path} onClick={() => onNavigate(item.path)} className={`nav-link ${active ? "nav-link-active" : ""}`}>
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`search-wrap hidden sm:flex ${searchOpen ? "search-wrap-open" : ""}`}>
            <Search size={17} className="shrink-0 text-[#89a09b]" />
            <input aria-label="ابحث عن قرار" placeholder="ابحث عن قرار..." onFocus={() => setSearchOpen(true)} onBlur={() => setSearchOpen(false)} />
          </div>
          <button onClick={() => onNavigate("/notifications")} aria-label="الإشعارات" className="icon-button relative">
            <Bell size={19} strokeWidth={1.8} />
            <span className="notification-dot" />
          </button>
          <button onClick={() => onNavigate("/profile")} className="hidden items-center gap-2 rounded-full border border-[#e1ebe5] bg-white py-1 pl-3 pr-1 text-right transition-shadow hover:shadow-sm sm:flex">
            <div className="avatar avatar-small">م</div>
            <span className="text-xs font-bold text-[#28534b]">مريم</span>
          </button>
          <Button onClick={onOpenCreate} className="brand-button hidden h-10 rounded-full px-4 text-sm font-bold sm:inline-flex"><Plus size={17} /> اطرح قراراً</Button>
          <button className="icon-button lg:hidden" aria-label="القائمة"><Menu size={20} /></button>
        </div>
      </div>
    </header>
  );
}

function BottomNav({ currentPath, onNavigate, onOpenCreate }: { currentPath: string; onNavigate: (path: string) => void; onOpenCreate: () => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#e5ece7] bg-[#fbfcf9]/95 px-4 py-2 backdrop-blur-xl lg:hidden" dir="rtl">
      <div className="mx-auto flex max-w-md items-end justify-around">
        {[
          { label: "الرئيسية", path: "/", icon: HomeIcon },
          { label: "استكشف", path: "/explore", icon: Compass },
          { label: "قرار", path: "/create", icon: Plus },
          { label: "الإشعارات", path: "/notifications", icon: Bell },
          { label: "حسابي", path: "/profile", icon: UserRound },
        ].map((item) => {
          const Icon = item.icon;
          const active = currentPath === item.path;
          if (item.path === "/create") {
            return <button key={item.path} onClick={onOpenCreate} className="bottom-nav-create"><Icon size={21} /><span>{item.label}</span></button>;
          }
          return <button key={item.path} onClick={() => onNavigate(item.path)} className={`bottom-nav-item ${active ? "bottom-nav-active" : ""}`}><Icon size={19} /><span>{item.label}</span></button>;
        })}
      </div>
    </div>
  );
}

function Hero({ onCreate, onExplore }: { onCreate: () => void; onExplore: () => void }) {
  return (
    <section className="hero-shell relative overflow-hidden rounded-[28px] px-6 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-[62px]" dir="rtl">
      <div className="hero-orb hero-orb-one" />
      <div className="hero-orb hero-orb-two" />
      <div className="hero-grid" />
      <div className="relative z-10 max-w-[650px]">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#d8efe7] backdrop-blur-sm">
          <Sparkles size={13} /> مساحة آمنة للقرارات المهمة
        </div>
        <h1 className="font-display max-w-[650px] text-[42px] font-extrabold leading-[1.08] tracking-[-0.06em] text-white sm:text-[58px] lg:text-[68px]">قرارك مش لازم<br /><span className="text-[#81d1af]">تاخده لوحدك.</span></h1>
        <p className="mt-5 max-w-[490px] text-[15px] leading-8 text-[#b7d5ca] sm:text-[17px]">اسأل ناس عاشوا نفس موقفك، شوف الأسباب والتجارب، وخد قرارك وأنت شايف الصورة كاملة.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button onClick={onCreate} className="brand-button-light h-12 rounded-full px-6 text-[15px] font-extrabold"><Plus size={18} /> اطرح قرارك الآن</Button>
          <button onClick={onExplore} className="hero-ghost-button"><Compass size={17} /> استكشف القرارات</button>
        </div>
        <div className="mt-9 flex flex-wrap items-center gap-5 text-xs text-[#9ec3b4]">
          <span className="flex items-center gap-2"><span className="mini-avatars"><i>س</i><i>ع</i><i>ن</i></span> أكثر من ١,٢٠٠ تجربة حقيقية</span>
          <span className="hidden h-4 w-px bg-white/15 sm:block" />
          <span className="flex items-center gap-1.5"><LockKeyhole size={14} /> مجهول وآمن</span>
        </div>
      </div>
      <div className="hero-scale" aria-hidden="true">
        <div className="scale-balance"><span /><div className="scale-beam"><i /><i /></div><div className="scale-stand"><b /><em /></div><div className="scale-pan pan-left" /><div className="scale-pan pan-right" /></div>
      </div>
    </section>
  );
}

function CategoryStrip({ selected, onSelect }: { selected: string; onSelect: (label: string) => void }) {
  return (
    <div className="category-scroll" dir="rtl">
      {categories.map((item) => {
        const Icon = item.icon;
        const active = selected === item.label;
        return <button key={item.label} onClick={() => onSelect(item.label)} className={`category-chip ${active ? "category-chip-active" : ""}`} style={active ? { borderColor: item.color, color: item.color, backgroundColor: `${item.color}0d` } : undefined}><Icon size={16} strokeWidth={active ? 2.2 : 1.8} /><span>{item.label}</span></button>;
      })}
    </div>
  );
}

function MiniDecisionCard({ decision, onOpen }: { decision: typeof decisions[number]; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="decision-mini-card group text-right" dir="rtl">
      <div className="decision-art" style={{ background: decision.image }}><span className="art-sun" /><span className="art-horizon" /><span className="art-person" /></div>
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-3"><span className="text-[10px] font-bold" style={{ color: decision.categoryColor }}>{decision.category}</span><span className="text-[10px] text-[#9aaea8]">{decision.time}</span></div>
        <h3 className="line-clamp-2 min-h-[45px] text-[15px] font-extrabold leading-6 text-[#123f38]">{decision.title}</h3>
        <div className="mt-4 flex items-center gap-2 text-[11px] font-bold"><span className="text-[#168064]">{decision.percentA}% {decision.optionA}</span><span className="text-[#d89098]">{100 - decision.percentA}% {decision.optionB}</span></div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#f1e5e4]"><div className="h-full rounded-full bg-[#1a8068] transition-all duration-300 group-hover:bg-[#0b5448]" style={{ width: `${decision.percentA}%` }} /></div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-[#8ca29c]"><span className="flex items-center gap-1"><UsersRound size={13} /> {decision.votes} رأي</span><span className="group-hover:text-[#197862]">التفاصيل <ArrowLeft className="mr-0.5 inline transition-transform group-hover:-translate-x-1" size={12} /></span></div>
      </div>
    </button>
  );
}

function DecisionCard({ decision, onOpen }: { decision: typeof decisions[number]; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="decision-list-card group text-right" dir="rtl">
      <div className="decision-list-art" style={{ background: decision.image }}><span className="art-sun" /><span className="art-horizon" /><span className="art-person" /></div>
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <div className="mb-2 flex items-center gap-2"><span className="category-dot" style={{ background: decision.categoryColor }} /><span className="text-[11px] font-bold" style={{ color: decision.categoryColor }}>{decision.category}</span><span className="text-[11px] text-[#b0beb8]">· {decision.time}</span></div>
        <h3 className="text-[15px] font-extrabold leading-6 text-[#123f38] transition-colors group-hover:text-[#197862] sm:text-[16px]">{decision.title}</h3>
        <div className="mt-3 flex items-center gap-3 text-[11px] font-bold"><span className="text-[#168064]">{decision.percentA}% {decision.optionA}</span><span className="text-[#d89098]">{100 - decision.percentA}% {decision.optionB}</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f4e6e4]"><div className="h-full rounded-full bg-[#229274]" style={{ width: `${decision.percentA}%` }} /></div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-[#8ca29c]"><span className="flex items-center gap-1"><UsersRound size={13} /> {decision.votes} تجربة مشاركة</span><span className="text-[#a5b3af]">بواسطة {decision.author}</span></div>
      </div>
      <ChevronLeft size={18} className="ml-4 hidden shrink-0 text-[#b2c3bd] transition-transform group-hover:-translate-x-1 sm:block" />
    </button>
  );
}

function ExperienceCard({ experience, featured = false }: { experience: typeof experiences[number]; featured?: boolean }) {
  return (
    <article className={`experience-card ${featured ? "experience-featured" : ""}`} dir="rtl">
      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="avatar" style={{ background: experience.accent }}>{experience.initials}</div><div><div className="flex items-center gap-1.5 text-sm font-extrabold text-[#18433c]">{experience.name}<BadgeCheck size={13} className="text-[#23886f]" fill="#daf1e6" /></div><div className="mt-1 text-[11px] text-[#8fa59e]">{experience.meta}</div></div></div><button className="icon-button icon-button-sm"><MoreHorizontal size={16} /></button></div>
      <h3 className="mt-5 text-[16px] font-extrabold leading-6 text-[#153f38]">{experience.title}</h3>
      <p className="mt-2.5 text-[13px] leading-7 text-[#607a72]">{experience.body}</p>
      <div className="mt-5 flex items-center justify-between gap-3"><span className={`experience-result ${experience.type === "نجحت" ? "result-good" : "result-bad"}`}>{experience.type === "نجحت" ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />} {experience.type}</span><div className="flex items-center gap-4 text-[11px] text-[#95a7a1]"><span className="flex items-center gap-1"><Heart size={13} /> {experience.likes}</span><span className="flex items-center gap-1"><MessageCircle size={13} /> {experience.comments}</span></div></div>
      {featured && <div className="mt-5 flex items-center justify-between border-t border-[#edf1ed] pt-4 text-[11px] font-bold text-[#4a7469]"><span className="flex items-center gap-1.5"><Star size={13} fill="#e0ac5f" className="text-[#e0ac5f]" /> تجربة مفيدة</span><button className="flex items-center gap-1 text-[#197862]">اسمع التجربة <Mic2 size={13} /></button></div>}
    </article>
  );
}

function HomeDashboard({ onCreate, onNavigate, onOpenDecision }: { onCreate: () => void; onNavigate: (path: string) => void; onOpenDecision: (id: string) => void }) {
  const [category, setCategory] = useState("الكل");
  const filtered = useMemo(() => category === "الكل" ? decisions : decisions.filter((decision) => decision.category === category), [category]);
  return (
    <main className="mx-auto max-w-[1240px] px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12">
      <Hero onCreate={onCreate} onExplore={() => onNavigate("/explore")} />
      <section className="mt-11" dir="rtl">
        <SectionHeading eyebrow="الآن على ميزان" title="قرارات نشطة" action="عرض الكل" onAction={() => onNavigate("/explore")} />
        <CategoryStrip selected={category} onSelect={setCategory} />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{filtered.slice(0, 4).map((decision) => <MiniDecisionCard key={decision.id} decision={decision} onOpen={() => onOpenDecision(decision.id)} />)}</div>
      </section>
      <section className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]" dir="rtl">
        <div>
          <SectionHeading eyebrow="من قلب التجربة" title="ناس مرّوا بنفس موقفك" action="شوف كل التجارب" onAction={() => onNavigate("/explore#experiences")} />
          <ExperienceCard experience={experiences[0]} featured />
        </div>
        <div>
          <SectionHeading eyebrow="إلهام يومي" title="تجارب مشابهة" action="استكشف" onAction={() => onNavigate("/explore#experiences")} />
          <div className="space-y-3"><ExperienceCard experience={experiences[1]} /><div className="soft-callout"><div className="callout-icon"><Sparkles size={18} /></div><div><div className="text-sm font-extrabold text-[#18433c]">عندك تجربة ممكن تفيد حد؟</div><p className="mt-1 text-xs leading-6 text-[#6d8980]">كلمتنا عن قرار أخذته، يمكن تكون سبب في وضوح حد تاني.</p></div><button onClick={() => toast.success("سنفتح لك نموذج إضافة التجربة قريباً")} className="mr-auto shrink-0 text-xs font-extrabold text-[#197862]">شاركها</button></div></div>
        </div>
      </section>
      <section className="mt-14" dir="rtl"><div className="insight-banner"><div className="insight-line" /><div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-[#9fd0bd]"><TrendingUp size={14} /> لماذا ميزان؟</div><h2 className="font-display text-[24px] font-extrabold tracking-[-0.04em] text-white">كل قرار هنا يترك أثرًا.</h2><p className="mt-2 max-w-[550px] text-sm leading-7 text-[#b3d4c8]">مش مجرد رأي سريع. مع كل نتيجة وتجربة، بنبني ذاكرة تساعدك أنت وغيرك تشوفوا الصورة أوضح في المرة الجاية.</p></div><button onClick={onCreate} className="insight-action">ابدأ بقرارك <ArrowLeft size={16} /></button></div></section>
    </main>
  );
}

function ExploreScreen({ onOpenDecision }: { onOpenDecision: (id: string) => void }) {
  const [filter, setFilter] = useState("الكل");
  const filtered = filter === "الكل" ? decisions : decisions.filter((decision) => decision.category === filter);
  return <main className="mx-auto max-w-[1240px] px-4 pb-24 pt-9 sm:px-6 sm:pt-12 lg:px-8 lg:pb-16" dir="rtl"><div className="mb-8 max-w-2xl"><div className="mb-3 text-xs font-bold tracking-[0.15em] text-[#197862]">استكشف بصوت هادي</div><h1 className="font-display text-[40px] font-extrabold leading-tight tracking-[-0.06em] text-[#0b3934]">قرارات ناس حقيقية،<br /><span className="text-[#21866b]">وتجارب تستاهل تتسمع.</span></h1><p className="mt-4 max-w-xl text-[15px] leading-8 text-[#718981]">اختار موضوع قريب منك، شوف التصويت، واقرأ الأسباب اللي ما بتبانش في السؤال الأول.</p></div><div className="explore-toolbar"><div className="flex items-center gap-2 text-sm font-extrabold text-[#18433c]"><SlidersHorizontal size={17} className="text-[#197862]" /> تصفية القرارات</div><CategoryStrip selected={filter} onSelect={setFilter} /></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((decision) => <DecisionCard key={decision.id} decision={decision} onOpen={() => onOpenDecision(decision.id)} />)}</div><div id="experiences" className="mt-16"><SectionHeading eyebrow="من تجاربهم" title="ممكن تلاقي نفسك هنا" /><div className="grid gap-4 lg:grid-cols-2">{experiences.map((item) => <ExperienceCard key={item.name} experience={item} featured />)}</div></div></main>;
}

function CreateScreen({ onBack, onPublished }: { onBack: () => void; onPublished: (title: string) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("علاقات");
  const [privacy, setPrivacy] = useState("مجهول للناس");
  const [choiceA, setChoiceA] = useState("");
  const [choiceB, setChoiceB] = useState("");
  const canPublish = title.trim().length > 7 && choiceA.trim() && choiceB.trim();
  return <main className="mx-auto max-w-[1040px] px-4 pb-28 pt-8 sm:px-6 sm:pt-12 lg:px-8" dir="rtl"><button onClick={onBack} className="back-link"><ArrowRight size={17} /> رجوع</button><div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.65fr]"><div><div className="mb-3 text-xs font-bold tracking-[0.15em] text-[#197862]">قرار جديد</div><h1 className="font-display text-[38px] font-extrabold leading-tight tracking-[-0.06em] text-[#0b3934] sm:text-[48px]">احكي لنا،<br /><span className="text-[#21866b]">إيه اللي محيّرك؟</span></h1><p className="mt-4 max-w-lg text-[15px] leading-8 text-[#718981]">خلي سؤالك واضح ومن غير ضغط. الناس هنا هتساعدك تشوف زوايا جديدة، مش تاخد القرار مكانك.</p><div className="mt-8 space-y-5"><label className="form-label">عنوان القرار<input value={title} onChange={(event) => setTitle(event.target.value)} className="form-input" placeholder="مثال: أسيب شغلي وأسافر؟" /></label><label className="form-label">احكي شوية عن الموقف <span className="font-normal text-[#9eb0aa]">(اختياري)</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} className="form-input min-h-[130px] resize-none" placeholder="إيه اللي حصل؟ وإيه أهم حاجة محتار فيها؟" /></label><div className="form-label">نوع القرار<div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{categories.slice(1).map((item) => { const Icon = item.icon; const active = selectedCategory === item.label; return <button type="button" onClick={() => setSelectedCategory(item.label)} key={item.label} className={`selection-tile ${active ? "selection-tile-active" : ""}`}><Icon size={17} style={{ color: item.color }} />{item.label}</button>; })}</div></div><div className="grid gap-3 sm:grid-cols-2"><label className="form-label">الاختيار الأول<input value={choiceA} onChange={(event) => setChoiceA(event.target.value)} className="form-input" placeholder="مثال: أسيب" /></label><label className="form-label">الاختيار الثاني<input value={choiceB} onChange={(event) => setChoiceB(event.target.value)} className="form-input" placeholder="مثال: أستمر" /></label></div><div className="form-label">الخصوصية<div className="mt-2 grid gap-2 sm:grid-cols-3">{["عام", "مجهول للناس", "خاص برابط"].map((item) => <button type="button" onClick={() => setPrivacy(item)} key={item} className={`privacy-option ${privacy === item ? "privacy-option-active" : ""}`}>{item === "عام" ? <UsersRound size={16} /> : item === "مجهول للناس" ? <EyeOff size={16} /> : <LockKeyhole size={16} />}{item}{privacy === item && <Check size={15} className="mr-auto" />}</button>)}</div></div><Button onClick={() => { if (!canPublish) return toast.error("اكتب عنوان القرار والاختيارين أولاً"); onPublished(title); }} disabled={!canPublish} className="brand-button h-12 w-full rounded-xl text-base font-extrabold">نشر القرار <ArrowLeft size={17} /></Button></div></div><div className="hidden lg:block"><div className="preview-sticky"><div className="mb-3 text-xs font-bold text-[#7d9890]">معاينة القرار</div><div className="phone-preview"><div className="mb-7 flex items-center justify-between"><Logo compact /><MoreHorizontal size={17} className="text-[#8ca29c]" /></div><div className="preview-image" style={{ background: decisions[2].image }}><span className="art-sun" /><span className="art-horizon" /><span className="art-person" /></div><span className="mt-4 inline-flex rounded-full bg-[#fff2ee] px-2 py-1 text-[10px] font-bold text-[#c76b60]">{selectedCategory}</span><h3 className="mt-3 text-lg font-extrabold leading-7 text-[#123f38]">{title || "هل أرجع أكلم الشخص ده؟"}</h3><p className="mt-2 text-xs leading-6 text-[#80968f]">{description || "اكتب تفاصيل صغيرة تساعد الناس تفهم الصورة كاملة."}</p><div className="mt-5 grid grid-cols-2 gap-2"><div className="preview-choice">{choiceA || "الاختيار الأول"}</div><div className="preview-choice">{choiceB || "الاختيار الثاني"}</div></div><div className="mt-5 flex items-center gap-2 text-[11px] text-[#94aaa3]"><EyeOff size={13} /> {privacy}</div></div></div></div></div></main>;
}

function DecisionScreen({ decision, onBack }: { decision: typeof decisions[number]; onBack: () => void }) {
  const [voted, setVoted] = useState<string | null>(null);
  const [experienceChoice, setExperienceChoice] = useState<string | null>(null);
  return <main className="mx-auto max-w-[1060px] px-4 pb-28 pt-7 sm:px-6 sm:pt-10 lg:px-8" dir="rtl"><button onClick={onBack} className="back-link"><ArrowRight size={17} /> كل القرارات</button><div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.8fr]"><div className="decision-detail-card"><div className="detail-cover" style={{ background: decision.image }}><span className="art-sun" /><span className="art-horizon" /><span className="art-person" /><div className="cover-actions"><button className="cover-icon"><Share2 size={17} /></button><button className="cover-icon"><Bookmark size={17} /></button></div></div><div className="p-5 sm:p-7"><div className="flex items-center justify-between gap-3"><span className="decision-tag" style={{ color: decision.categoryColor, backgroundColor: `${decision.categoryColor}14` }}>{decision.category}</span><span className="text-xs text-[#8fa59e]">منذ يوم · مجهول للناس</span></div><h1 className="mt-4 font-display text-[30px] font-extrabold leading-[1.2] tracking-[-0.05em] text-[#0b3934] sm:text-[38px]">{decision.title}</h1><p className="mt-3 text-[14px] leading-7 text-[#6e887f]">كنت مرتبط بيه من فترة، ولما حصلت مشكلة قررنا نبعد. دلوقتي بعد وقت طويل، هل الرجوع قرار صح ولا مجرد حنين؟</p><div className="mt-7 rounded-2xl border border-[#e8efea] bg-[#fbfcf8] p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><span className="text-sm font-extrabold text-[#1a443c]">إيه رأيك؟</span><span className="text-[11px] text-[#98aaa4]">{decision.votes + (voted ? 1 : 0)} شخص صوتوا</span></div><div className="space-y-3"><button onClick={() => { setVoted("a"); toast.success("اتسجل صوتك بشكل مجهول"); }} className={`vote-option ${voted === "a" ? "vote-option-selected" : ""}`}><span className="flex items-center gap-2"><span className="radio-dot" />{decision.optionA}</span><strong>{voted ? `${decision.percentA + (voted === "a" ? 1 : 0)}%` : ""}</strong></button><button onClick={() => { setVoted("b"); toast.success("اتسجل صوتك بشكل مجهول"); }} className={`vote-option ${voted === "b" ? "vote-option-selected vote-option-second" : ""}`}><span className="flex items-center gap-2"><span className="radio-dot radio-dot-second" />{decision.optionB}</span><strong>{voted ? `${100 - decision.percentA + (voted === "b" ? 1 : 0)}%` : ""}</strong></button></div><div className="mt-4 flex items-center gap-3 text-[11px] text-[#91a59e]"><EyeOff size={13} /> تصويتك مجهول، وممكن تعدّله في أي وقت</div></div><div className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-extrabold text-[#19433b]">أهم الأسباب</h2><span className="text-xs font-bold text-[#197862]">{decision.votes} رأي</span></div><div className="reason-block reason-good"><div className="reason-title"><ThumbsUp size={15} /> ناس شايفة إنك تكلمه</div><ul><li>لو المشكلة اتحلت فعلًا، التجربة تستحق فرصة.</li><li>لسه فيه مشاعر وكلام متقالش بوضوح.</li><li>الوقت ممكن يكون غيّر طريقة تفكيركم.</li></ul></div><div className="reason-block reason-bad"><div className="reason-title"><ThumbsDown size={15} /> وناس شايفة لأ</div><ul><li>نفس المشاكل ممكن تتكرر لو مفيش تغيير حقيقي.</li><li>أحيانًا الاشتياق مش معناه إن الرجوع صح.</li><li>الأفضل تفهم سبب الانفصال الأول.</li></ul></div></div></div></div><aside className="space-y-4"><div className="side-card"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-extrabold text-[#19433b]">هل مررت بتجربة مشابهة؟</h2><span className="rounded-full bg-[#eaf5ef] px-2 py-1 text-[10px] font-bold text-[#197862]">٦٣ شخص</span></div><p className="mb-4 text-xs leading-6 text-[#7a9189]">خلّي صاحب القرار يشوف رأي الناس اللي عاشوا نفس الموقف فعلًا.</p><div className="space-y-2">{["أيوه، ونجحت", "أيوه، وفشلت", "قريبة منها", "لأ، لكن عندي رأي"].map((item) => <button key={item} onClick={() => setExperienceChoice(item)} className={`experience-choice ${experienceChoice === item ? "experience-choice-active" : ""}`}><span className="radio-dot" />{item}{experienceChoice === item && <Check size={15} className="mr-auto text-[#197862]" />}</button>)}</div><Button onClick={() => experienceChoice ? toast.success("شكراً، دلوقتي تقدر تضيف تفاصيل تجربتك") : toast.error("اختار إجابة الأول")} className="brand-button mt-4 h-10 w-full rounded-xl text-xs font-extrabold">كمل تجربتك <ArrowLeft size={14} /></Button></div><div className="side-card"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-extrabold text-[#19433b]">ناس عاشوا التجربة</h2><button className="text-xs font-bold text-[#197862]">الكل</button></div><ExperienceCard experience={experiences[0]} /></div></aside></div></main>;
}

function ProfileScreen({ onNavigate }: { onNavigate: (path: string) => void }) {
  return <main className="mx-auto max-w-[1080px] px-4 pb-28 pt-8 sm:px-6 sm:pt-12 lg:px-8" dir="rtl"><div className="profile-hero"><div className="profile-cover-shape" /><div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div className="flex items-end gap-4"><div className="avatar avatar-xl">م</div><div><div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#b0d9ca]"><BadgeCheck size={14} /> عضو من ٢٠٢٤</div><h1 className="font-display text-3xl font-extrabold tracking-[-0.05em] text-white">مريم أحمد</h1><p className="mt-1 text-sm text-[#b1d1c5]">أحب أسمع التجارب قبل ما أخد قراري.</p></div></div><Button onClick={() => toast.success("سيتم فتح إعدادات الحساب قريباً")} className="profile-edit-button">تعديل الملف</Button></div><div className="relative z-10 mt-7 grid max-w-xl grid-cols-3 gap-2 border-t border-white/10 pt-5 text-center text-white"><div><strong className="block text-xl">١٢٤</strong><span className="text-[11px] text-[#a9cabd]">تجربة</span></div><div><strong className="block text-xl">١٨</strong><span className="text-[11px] text-[#a9cabd]">مفيدة</span></div><div><strong className="block text-xl">٧٢</strong><span className="text-[11px] text-[#a9cabd]">متابع</span></div></div></div><div className="mt-8 flex items-center justify-between border-b border-[#e5ede8]" dir="rtl"><div className="profile-tabs"><button className="profile-tab profile-tab-active">قراراتي</button><button className="profile-tab">تجاربي</button><button className="profile-tab">المحفوظة</button></div><button onClick={() => onNavigate("/create")} className="hidden items-center gap-1 text-xs font-extrabold text-[#197862] sm:flex"><Plus size={15} /> قرار جديد</button></div><div className="mt-6 grid gap-4 lg:grid-cols-2">{decisions.slice(0, 3).map((decision) => <DecisionCard key={decision.id} decision={decision} onOpen={() => onNavigate(`/decision/${decision.id}`)} />)}</div></main>;
}

function NotificationsScreen() {
  return <main className="mx-auto max-w-[780px] px-4 pb-28 pt-8 sm:px-6 sm:pt-12" dir="rtl"><div className="mb-8 flex items-end justify-between"><div><div className="mb-3 text-xs font-bold tracking-[0.15em] text-[#197862]">كل جديد عندك</div><h1 className="font-display text-[40px] font-extrabold tracking-[-0.06em] text-[#0b3934]">الإشعارات</h1></div><button onClick={() => toast.success("تم تعليم كل الإشعارات كمقروءة")} className="text-xs font-bold text-[#197862]">تعليم الكل كمقروء</button></div><div className="notification-list">{notifications.map((item, index) => { const Icon = item.icon; return <button key={item.title} onClick={() => toast(`فتح: ${item.title}`)} className={`notification-item ${index === 0 ? "notification-unread" : ""}`}><div className={`notification-icon notification-${item.tone}`}><Icon size={18} /></div><div className="min-w-0 flex-1 text-right"><div className="flex items-center gap-2"><span className="text-sm font-extrabold text-[#19433b]">{item.title}</span>{index === 0 && <span className="h-1.5 w-1.5 rounded-full bg-[#218d71]" />}</div><p className="mt-1 truncate text-xs text-[#7a928a]">{item.body}</p></div><span className="shrink-0 text-[11px] text-[#a6b5af]">{item.time}</span><ChevronLeft size={16} className="shrink-0 text-[#becbc6]" /></button>; })}</div><div className="mt-8 rounded-2xl border border-dashed border-[#cdded5] bg-[#f6faf6] p-7 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#8cb9a8] shadow-sm"><Bell size={20} /></div><h2 className="mt-4 text-base font-extrabold text-[#1a443c]">وصلت لآخر الجديد</h2><p className="mt-2 text-xs text-[#829991]">هرجع أنبهك لما يحصل شيء جديد على قراراتك.</p></div></main>;
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const currentPath = location.startsWith("/decision/") ? "/decision" : location;
  const selectedDecision = decisions.find((decision) => location.endsWith(decision.id)) ?? decisions[2];
  const navigate = (path: string) => setLocation(path);
  const openCreate = () => navigate("/create");
  return <div className="min-h-screen bg-[#fbfcf8] text-[#123f38]"><Header currentPath={currentPath} onNavigate={navigate} onOpenCreate={openCreate} />{location === "/" && <HomeDashboard onCreate={openCreate} onNavigate={navigate} onOpenDecision={(id) => navigate(`/decision/${id}`)} />}{location === "/explore" && <ExploreScreen onOpenDecision={(id) => navigate(`/decision/${id}`)} />}{location === "/create" && <CreateScreen onBack={() => navigate("/")} onPublished={(title) => { toast.success("اتنشر قرارك! هنبدأ نجمع لك الآراء"); navigate(`/decision/new-${title}`); }} />}{location.startsWith("/decision/") && <DecisionScreen decision={selectedDecision} onBack={() => navigate("/explore")} />}{location === "/profile" && <ProfileScreen onNavigate={navigate} />}{location === "/notifications" && <NotificationsScreen />}<BottomNav currentPath={currentPath} onNavigate={navigate} onOpenCreate={openCreate} /></div>;
}
