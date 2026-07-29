import React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  DollarSign,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  MousePointer2,
  ArrowRight,
  Wallet,
  TrendingUp,
  Target,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Scissors,
  Zap,
} from "lucide-react";

export interface ManualSection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  content: React.ReactNode;
}

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    subtitle: "Your first steps in the ERP",
    icon: <LayoutDashboard size={20} />,
    color: "text-blue-500",
    bg: "bg-blue-50",
    content: (
      <div className="space-y-6">
        <div className="prose max-w-none">
          <p className="text-muted-foreground leading-relaxed">
            Welcome to <strong>Gloriaz Daughter ERP</strong>. This system is your digital assistant, designed to help you manage orders, track materials, and understand your business profits without needing to be a computer expert.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="p-4 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all">
            <h4 className="font-semibold flex items-center gap-2 mb-3 text-sm">
              <MousePointer2 size={20} className="text-[hsl(46,70%,40%)]" />
              1. Logging In
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <ArrowRight size={16} className="mt-0.5 flex-shrink-0" />
                <span>Open your browser (Chrome is best).</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight size={16} className="mt-0.5 flex-shrink-0" />
                <span>Enter your email and password.</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight size={16} className="mt-0.5 flex-shrink-0" />
                <span>Click <strong>Sign In</strong>.</span>
              </li>
            </ul>
          </div>
          <div className="p-4 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all">
            <h4 className="font-semibold flex items-center gap-2 mb-3 text-sm">
              <LayoutDashboard size={20} className="text-[hsl(46,70%,40%)]" />
              2. The Dashboard
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This is your "Home" screen. It shows you how many orders are active and which fabrics are running low. Use the <strong>Quick Links</strong> to jump straight to work.
            </p>
          </div>
        </div>

        <div className="bg-[hsl(46,70%,40%)]/10 p-6 rounded-xl border border-[hsl(46,70%,40%)]/20 flex gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm h-fit">
            <Zap className="text-[hsl(46,70%,40%)]" size={28} />
          </div>
          <div>
            <h4 className="font-bold text-[hsl(46,70%,40%)] mb-1">Practical Tip</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bookmark this page in your browser by clicking the <strong>Star (⭐)</strong> icon in the address bar so you can find it instantly every morning.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "orders",
    title: "Managing Orders",
    subtitle: "From enquiry to delivery",
    icon: <ShoppingCart size={20} />,
    color: "text-purple-500",
    bg: "bg-purple-50",
    content: (
      <div className="space-y-8">
        <section>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <div className="h-6 w-1 bg-[hsl(46,70%,40%)] rounded-full" />
            How to Create a New Order
          </h3>
          <div className="space-y-5">
            {[
              {
                title: "Start",
                text: "Click 'Create Order' and choose 'Custom' for bespoke items or 'Pre-designed Garment' for items you already have in stock.",
              },
              {
                title: "Customer",
                text: "Select an existing customer or click '+ Add New' to quickly save their name and phone number.",
              },
              {
                title: "Requirements",
                text: "Select the garment type (e.g., Chitenge Dress) and describe what the customer wants.",
              },
              {
                title: "Materials",
                text: "Choose the fabrics and trims needed. The system will automatically calculate the cost for you.",
              },
              {
                title: "Pricing & Deposit",
                text: "Review the suggested price, set your final price, and record the deposit paid.",
              },
            ].map((step, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-muted-foreground group-hover:bg-[hsl(46,70%,40%)] group-hover:text-white transition-colors flex-shrink-0">
                  {i + 1}
                </div>
                <div className="pt-2 flex-1">
                  <h4 className="font-bold text-base text-foreground mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-white">
          <h4 className="font-bold flex items-center gap-2 mb-4 text-[hsl(46,70%,40%)] text-lg">
            <AlertCircle size={20} />
            Critical Workflow Rule
          </h4>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Always update the <strong>Order Status</strong> as you work. This keeps the customer timeline accurate and sends notifications to the team.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Enquiry", "Measurements", "Production", "Fitting", "Completed"].map((s, i) => (
              <span key={i} className="px-3 py-1 bg-slate-800 rounded-full text-xs font-bold text-slate-400">
                {s}
              </span>
            ))}
          </div>
        </div>

        <section>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <div className="h-6 w-1 bg-purple-500 rounded-full" />
            Handling Payments & Balances
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-green-50 rounded-xl border border-green-100">
              <h5 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                <Wallet size={18} />
                Recording Deposits
              </h5>
              <p className="text-xs text-green-800 leading-relaxed">
                Enter the deposit amount when creating the order. The system will calculate the remaining balance automatically.
              </p>
            </div>
            <div className="p-5 bg-amber-50 rounded-xl border border-amber-100">
              <h5 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                <TrendingUp size={18} />
                Final Payment
              </h5>
              <p className="text-xs text-amber-800 leading-relaxed">
                When the customer collects their order, record the final payment. The balance will update to zero.
              </p>
            </div>
          </div>
        </section>
      </div>
    ),
  },
  {
    id: "inventory",
    title: "Inventory & Production",
    subtitle: "Materials and workshop tracking",
    icon: <Package size={20} />,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    content: (
      <div className="space-y-8">
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
            <div className="h-6 w-1 bg-emerald-500 rounded-full" />
            Why Inventory Matters
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When you record your fabrics and buttons here, the system can warn you <strong>before</strong> you run out. It also knows exactly how much money is sitting on your shelves.
          </p>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 bg-card border rounded-xl shadow-sm space-y-3">
            <h4 className="font-bold flex items-center gap-2 text-base">
              <CheckCircle2 size={20} className="text-emerald-500" />
              Adding Stock
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When you buy new fabric, use the <strong>Restock</strong> button. Enter how much you bought and the price. The system will update your cost automatically.
            </p>
          </div>
          <div className="p-6 bg-card border rounded-xl shadow-sm space-y-3">
            <h4 className="font-bold flex items-center gap-2 text-base">
              <Scissors size={20} className="text-emerald-500" />
              Workshop Batches
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Use <strong>Production Batches</strong> to track making multiple pieces at once (like school uniforms). As you mark stages as 'Done', the system tracks progress.
            </p>
          </div>
        </div>

        <section>
          <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
            <h4 className="font-bold text-emerald-900 mb-4 text-base flex items-center gap-2">
              <Zap size={20} />
              Material Tracking
            </h4>
            <ul className="space-y-3 text-sm text-emerald-800">
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                <span>Automatically reduce inventory stock levels</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                <span>Calculate total material cost for the batch</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                <span>Warn you if there's not enough stock</span>
              </li>
            </ul>
          </div>
        </section>

        <div className="bg-emerald-50/50 p-8 rounded-xl border border-emerald-100/50 flex gap-4">
          <Clock className="text-emerald-600 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-emerald-900 mb-1">Wait for Completion</h4>
            <p className="text-sm text-emerald-800 leading-relaxed">
              When you set a Production Batch to <strong>Completed</strong>, the system automatically adds those finished pieces to your inventory so they can be sold!
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "finance",
    title: "Understanding Profits",
    subtitle: "Finance and reporting simplified",
    icon: <DollarSign size={20} />,
    color: "text-amber-500",
    bg: "bg-amber-50",
    content: (
      <div className="space-y-8">
        <p className="text-sm text-muted-foreground leading-relaxed">
          You don't need to be an accountant. The system does all the calculations to show you if you are making money or losing it.
        </p>

        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-muted/50 border-b font-bold text-sm">Financial Definitions</div>
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h5 className="font-bold">Revenue</h5>
                <p className="text-xs text-muted-foreground mt-1">Total money coming in from sales.</p>
              </div>
              <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded text-[10px] uppercase">+ PLUS</span>
            </div>
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h5 className="font-bold">COGS</h5>
                <p className="text-xs text-muted-foreground mt-1">Cost of Materials & Labour.</p>
              </div>
              <span className="bg-red-100 text-red-700 font-bold px-3 py-1 rounded text-[10px] uppercase">- MINUS</span>
            </div>
            <div className="flex justify-between items-start pt-4">
              <div>
                <h5 className="font-bold text-[hsl(46,70%,40%)]">Net Profit</h5>
                <p className="text-xs text-muted-foreground mt-1">The actual profit you made.</p>
              </div>
              <span className="bg-[hsl(46,70%,40%)] text-white font-bold px-4 py-1 rounded text-[10px] uppercase">= EQUALS</span>
            </div>
          </div>
        </div>

        <section>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
            <div className="h-6 w-1 bg-amber-500 rounded-full" />
            Financial Dashboard
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-card border rounded-xl space-y-2">
              <div className="p-2 bg-green-100 w-fit rounded-lg">
                <TrendingUp size={16} className="text-green-600" />
              </div>
              <h5 className="font-bold text-sm">Revenue</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">Total sales for the selected period.</p>
            </div>
            <div className="p-4 bg-card border rounded-xl space-y-2">
              <div className="p-2 bg-red-100 w-fit rounded-lg">
                <Package size={16} className="text-red-600" />
              </div>
              <h5 className="font-bold text-sm">Costs</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">Expense of materials and labor.</p>
            </div>
            <div className="p-4 bg-card border rounded-xl space-y-2">
              <div className="p-2 bg-[hsl(46,70%,40%)]/10 w-fit rounded-lg">
                <Target size={16} className="text-[hsl(46,70%,40%)]" />
              </div>
              <h5 className="font-bold text-sm">Profit</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">Your true earnings after all costs.</p>
            </div>
          </div>
        </section>

        <div className="flex gap-4 p-6 bg-card border rounded-xl shadow-sm items-center">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Download size={24} />
          </div>
          <div>
            <h4 className="font-bold text-sm">Exporting Reports</h4>
            <p className="text-xs text-muted-foreground">Download Excel files for your accountant or bank.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "settings",
    title: "Settings Hub",
    subtitle: "Workshop configurations",
    icon: <Settings size={20} />,
    color: "text-cyan-500",
    bg: "bg-cyan-50",
    content: (
      <div className="space-y-8">
        <section>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
            <div className="h-6 w-1 bg-cyan-500 rounded-full" />
            Workshop Setup
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-card border rounded-xl space-y-2">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <DollarSign size={16} className="text-amber-500" />
                Financial Rules
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Control your Profit Margins and Tax Rates. This affects suggested pricing.
              </p>
            </div>
            <div className="p-5 bg-card border rounded-xl space-y-2">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Scissors size={16} className="text-[hsl(46,70%,40%)]" />
                Workshop & Labour
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Manage your Garment Types and Labour Rates.
              </p>
            </div>
          </div>
        </section>

        <div className="bg-cyan-50 p-6 rounded-xl border border-cyan-100 flex gap-4">
          <HelpCircle className="text-cyan-600 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-cyan-900 mb-1">Pro Tip</h4>
            <p className="text-xs text-cyan-800 leading-relaxed">
              Review your Labour Rates regularly. Adjusting them immediately protects your profit margins!
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "support",
    title: "Support",
    subtitle: "Common FAQs and help",
    icon: <HelpCircle size={20} />,
    color: "text-slate-500",
    bg: "bg-slate-50",
    content: (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="p-5 bg-card border rounded-xl">
            <p className="font-bold text-sm mb-1 text-[hsl(46,70%,40%)]">"Suggested price seems low?"</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Increase profit margin or hourly rate in Settings.</p>
          </div>
          <div className="p-5 bg-card border rounded-xl">
            <p className="font-bold text-sm mb-1 text-[hsl(46,70%,40%)]">"Mistake on an order?"</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Click edit on the order to fix any detail.</p>
          </div>
          <div className="p-5 bg-card border rounded-xl">
            <p className="font-bold text-sm mb-1 text-[hsl(46,70%,40%)]">"Can't find a material?"</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Add it to Inventory first.</p>
          </div>
        </div>

        <div className="p-8 bg-[hsl(46,70%,40%)] rounded-xl text-white text-center">
          <h4 className="text-xl font-bold mb-2">Still Need Help?</h4>
          <p className="text-sm opacity-90 mb-6">Contact support via WhatsApp or email.</p>
          <div className="flex flex-col gap-3">
            <button className="bg-white/10 hover:bg-white/20 py-3 rounded-lg font-bold text-sm transition-all">
              Email Support
            </button>
          </div>
        </div>
      </div>
    ),
  },
];
