import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './about.css';

const About = () => {
  // Content object with both languages
  const content = {
    en: {
      title: "About South Lebanon Aid",
      subtitle: "Supporting Families Affected by War",
      mission: {
        title: "Our Mission",
        description: "This platform is designed to support families in South Lebanon whose homes were destroyed during wartime. We provide a transparent, secure system that connects families in need with generous donors, while ensuring all claims are properly verified through our trained professionals."
      },
      howItWorks: {
        title: "How It Works",
        steps: [
          {
            icon: "fas fa-home",
            title: "Families Submit Claims",
            description: "Affected families register and submit evidence of their destroyed homes, including photos and supporting documents."
          },
          {
            icon: "fas fa-search",
            title: "Professional Verification",
            description: "Our trained checkers investigate each case, verify documents, and conduct field visits when necessary."
          },
          {
            icon: "fas fa-check-circle",
            title: "Case Approval",
            description: "Verified cases are approved and made visible to potential donors with detailed information about needs."
          },
          {
            icon: "fas fa-heart",
            title: "Secure Donations",
            description: "Donors can view approved cases on our interactive map and make targeted donations securely online."
          }
        ]
      },
      userTypes: {
        title: "Who We Serve",
        types: [
          {
            icon: "fas fa-users",
            title: "Families in Need",
            description: "People whose homes were destroyed during wartime can register, submit evidence, and track their request status while receiving updates throughout the process."
          },
          {
            icon: "fas fa-user-shield",
            title: "Verification Specialists",
            description: "Trained professionals who authenticate evidence, conduct field investigations, and ensure all claims are legitimate before approval."
          },
          {
            icon: "fas fa-donate",
            title: "Generous Donors",
            description: "Individuals who wish to help can explore our interactive map, filter cases by region or need, and make secure donations with full transparency."
          },
          {
            icon: "fas fa-cog",
            title: "System Administrators",
            description: "Manage the platform, oversee checker assignments, and monitor system performance to ensure smooth operations."
          }
        ]
      },
      features: {
        title: "Key Features",
        list: [
          {
            icon: "fas fa-map-marked-alt",
            title: "Interactive Regional Map",
            description: "Explore South Lebanon with color-coded damage regions, case statistics, and filtering options for targeted assistance."
          },
          {
            icon: "fas fa-shield-alt",
            title: "Secure Verification Process",
            description: "Multi-layered verification including document authentication and field visits to ensure transparency and trust."
          },
          {
            icon: "fas fa-chart-bar",
            title: "Real-time Tracking",
            description: "Families can track their request status, and donors can monitor their contributions and impact in real-time."
          },
          {
            icon: "fas fa-mobile-alt",
            title: "User-Friendly Interface",
            description: "Accessible platform supporting both English and Arabic languages with intuitive navigation for all users."
          }
        ]
      },
      transparency: {
        title: "Our Commitment to Transparency",
        description: "We believe in complete transparency in our operations. Every donation is tracked, every case is verified by professionals, and donors receive detailed reports on how their contributions are making a difference. Our interactive dashboard provides real-time statistics on fund distribution, case completion rates, and regional needs."
      },
      getStarted: {
        title: "Get Started Today",
        description: "Whether you're a family in need, a potential donor, or someone who wants to volunteer as a verification specialist, we're here to help. Join our community working together to rebuild South Lebanon."
      }
    },
    ar: {
      title: "حول مساعدة جنوب لبنان",
      subtitle: "دعم العائلات المتضررة من الحرب",
      mission: {
        title: "مهمتنا",
        description: "تم تصميم هذه المنصة لدعم العائلات في جنوب لبنان التي دُمرت منازلها أثناء الحرب. نحن نوفر نظاماً شفافاً وآمناً يربط العائلات المحتاجة بالمتبرعين الكرماء، مع ضمان التحقق من جميع الادعاءات بشكل صحيح من خلال المتخصصين المدربين لدينا."
      },
      howItWorks: {
        title: "كيف يعمل النظام",
        steps: [
          {
            icon: "fas fa-home",
            title: "تقديم المطالبات من العائلات",
            description: "العائلات المتضررة تسجل وتقدم أدلة على منازلها المدمرة، بما في ذلك الصور والوثائق الداعمة."
          },
          {
            icon: "fas fa-search",
            title: "التحقق المهني",
            description: "مدققونا المدربون يحققون في كل حالة، يتحققون من الوثائق، ويقومون بزيارات ميدانية عند الضرورة."
          },
          {
            icon: "fas fa-check-circle",
            title: "الموافقة على الحالة",
            description: "الحالات المتحقق منها تتم الموافقة عليها وتصبح مرئية للمتبرعين المحتملين مع معلومات مفصلة عن الاحتياجات."
          },
          {
            icon: "fas fa-heart",
            title: "تبرعات آمنة",
            description: "يمكن للمتبرعين عرض الحالات المعتمدة على خريطتنا التفاعلية وتقديم تبرعات مستهدفة بأمان عبر الإنترنت."
          }
        ]
      },
      userTypes: {
        title: "من نخدم",
        types: [
          {
            icon: "fas fa-users",
            title: "العائلات المحتاجة",
            description: "الأشخاص الذين دُمرت منازلهم أثناء الحرب يمكنهم التسجيل وتقديم الأدلة وتتبع حالة طلبهم مع تلقي التحديثات طوال العملية."
          },
          {
            icon: "fas fa-user-shield",
            title: "متخصصو التحقق",
            description: "متخصصون مدربون يقومون بمصادقة الأدلة وإجراء تحقيقات ميدانية وضمان شرعية جميع الادعاءات قبل الموافقة."
          },
          {
            icon: "fas fa-donate",
            title: "المتبرعون الكرماء",
            description: "الأفراد الذين يرغبون في المساعدة يمكنهم استكشاف خريطتنا التفاعلية وتصفية الحالات حسب المنطقة أو الحاجة وتقديم تبرعات آمنة بشفافية كاملة."
          },
          {
            icon: "fas fa-cog",
            title: "مديرو النظام",
            description: "إدارة المنصة والإشراف على مهام المدققين ومراقبة أداء النظام لضمان العمليات السلسة."
          }
        ]
      },
      features: {
        title: "الميزات الرئيسية",
        list: [
          {
            icon: "fas fa-map-marked-alt",
            title: "خريطة إقليمية تفاعلية",
            description: "استكشف جنوب لبنان مع مناطق الضرر المرمزة بالألوان وإحصائيات الحالات وخيارات التصفية للمساعدة المستهدفة."
          },
          {
            icon: "fas fa-shield-alt",
            title: "عملية تحقق آمنة",
            description: "تحقق متعدد الطبقات يشمل مصادقة الوثائق والزيارات الميدانية لضمان الشفافية والثقة."
          },
          {
            icon: "fas fa-chart-bar",
            title: "تتبع في الوقت الفعلي",
            description: "يمكن للعائلات تتبع حالة طلبهم، ويمكن للمتبرعين مراقبة مساهماتهم وتأثيرها في الوقت الفعلي."
          },
          {
            icon: "fas fa-mobile-alt",
            title: "واجهة سهلة الاستخدام",
            description: "منصة يمكن الوصول إليها تدعم اللغتين الإنجليزية والعربية مع تنقل بديهي لجميع المستخدمين."
          }
        ]
      },
      transparency: {
        title: "التزامنا بالشفافية",
        description: "نؤمن بالشفافية الكاملة في عملياتنا. كل تبرع يتم تتبعه، وكل حالة يتم التحقق منها من قبل المتخصصين، والمتبرعون يتلقون تقارير مفصلة عن كيفية إحداث مساهماتهم فرقاً. لوحة القيادة التفاعلية لدينا توفر إحصائيات في الوقت الفعلي حول توزيع الأموال ومعدلات إكمال الحالات والاحتياجات الإقليمية."
      },
      getStarted: {
        title: "ابدأ اليوم",
        description: "سواء كنت عائلة محتاجة أو متبرعاً محتملاً أو شخصاً يريد التطوع كمتخصص تحقق، نحن هنا للمساعدة. انضم إلى مجتمعنا الذي يعمل معاً لإعادة بناء جنوب لبنان."
      }
    }
  };

  // Use English content by default (consistent with other pages)
  const currentContent = content.en;

  // Set up page effects
  useEffect(() => {
    // Set page title
    document.title = 'About South Lebanon Aid - Supporting War-Affected Families';

    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  return (
    <div className="about-page">
      <Navbar />
      <div className="about-container">

        {/* Header */}
        <header className="about-header">
          <h1 className="about-title">{currentContent.title}</h1>
          <p className="about-subtitle">{currentContent.subtitle}</p>
        </header>

        {/* Mission Section */}
        <section className="about-section">
          <h2 className="section-title">{currentContent.mission.title}</h2>
          <p className="section-description">{currentContent.mission.description}</p>
        </section>

        {/* How It Works */}
        <section className="about-section">
          <h2 className="section-title">{currentContent.howItWorks.title}</h2>
          <div className="steps-grid">
            {currentContent.howItWorks.steps.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{index + 1}</div>
                <i className={step.icon}></i>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* User Types */}
        <section className="about-section">
          <h2 className="section-title">{currentContent.userTypes.title}</h2>
          <div className="user-types-grid">
            {currentContent.userTypes.types.map((type, index) => (
              <div key={index} className="user-type-card">
                <i className={type.icon}></i>
                <h3>{type.title}</h3>
                <p>{type.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="about-section">
          <h2 className="section-title">{currentContent.features.title}</h2>
          <div className="features-grid">
            {currentContent.features.list.map((feature, index) => (
              <div key={index} className="feature-card">
                <i className={feature.icon}></i>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Transparency */}
        <section className="about-section transparency-section">
          <h2 className="section-title">{currentContent.transparency.title}</h2>
          <p className="section-description">{currentContent.transparency.description}</p>
        </section>

        {/* Get Started */}
        <section className="about-section get-started-section">
          <h2 className="section-title">{currentContent.getStarted.title}</h2>
          <p className="section-description">{currentContent.getStarted.description}</p>
          <Link to="/register" className="cta-button cta-button-enhanced">
            <div className="button-content">
              <i className="fas fa-hand-holding-heart button-icon"></i>
              <span className="button-text">Start Helping Now</span>
            </div>
            <div className="button-background"></div>
            <div className="button-shine"></div>
          </Link>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default About;