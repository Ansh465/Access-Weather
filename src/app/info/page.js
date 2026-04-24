"use client";

import Header from "@/components/Header";

const iconSearch = "/icon/search.svg";
const iconSparkles = "/icon/Sparkles.svg";
const iconWrench = "/icon/Wrench.svg";
const iconHelp = "/icon/HelpCircle.svg";
const iconChevron = "/icon/ChevronDownIcon.svg";
const iconPhone = "/icon/Phone.svg";
const iconMail = "/icon/Mail.svg";
const iconChat = "/icon/MessageCircle.svg";
const iconMailOutline = "/icon/Mail-1.svg";

const FEATURES = [
  {
    title: "Real-time Weather Data",
    copy:
      "Get up-to-date weather information for all major UK cities including temperature, humidity, wind speed, and atmospheric pressure."
  },
  {
    title: "7-Day Forecast",
    copy:
      "Plan ahead with our detailed weekly forecast showing daily high and low temperatures along with weather conditions."
  },
  {
    title: "Hourly Updates",
    copy:
      "Track weather changes throughout the day with hourly forecasts showing temperature variations and precipitation chances."
  },
  {
    title: "Air Quality Index",
    copy:
      "Monitor air quality levels and health risks to make informed decisions about outdoor activities."
  },
  {
    title: "UV Index Tracking",
    copy:
      "Stay safe in the sun with real-time UV index readings and recommendations for sun protection."
  },
  {
    title: "Multi-City Search",
    copy:
      "Easily search and switch between different UK cities to check weather conditions in multiple locations."
  }
];

const TROUBLESHOOTING = [
  "Weather data is not loading",
  "City search is not working",
  "Forecast information is inaccurate",
  "App is slow or unresponsive"
];

const FAQS = [
  {
    question: "How often is the weather data updated?",
    answer:
      "To guarantee that the most recent conditions are displayed, weather data is updated often utilising real-time information from the weather API."
  },
  {
    question: "Which cities are covered by AccessWeather?",
    answer:
      "AccessWeather provides weather information for cities and towns across the United Kingdom."
  },
  {
    question: "Is AccessWeather free to use?",
    answer:
      "Yes, you can check weather conditions and forecasts for free using AccessWeather."
  },
  {
    question: "Can I save my favourite cities?",
    answer:
      "Yes, you can save cities to your favourites list for quick and easy access."
  },
  {
    question: "What does the Air Quality Index mean?",
    answer:
      "The Air Quality Index (AQI) identifies possible effects on health as well as how clean or filthy the air is."
  },
  {
    question: "How accurate are the weather forecasts?",
    answer:
      "Although weather forecasts are usually accurate and based on trustworthy data sources, circumstances might change suddenly."
  }
];

export default function InfoPage() {
  return (
    <main className="page info-page" data-node-id="42:263">
      <Header>
        <div className="header-search" data-node-id="42:268">
          <img src={iconSearch} alt="" aria-hidden="true" />
          <input aria-label="Search" placeholder="Search....." />
        </div>
      </Header>

      <section className="info-hero">
        <h1 data-node-id="42:281">Information &amp; Support</h1>
        <p data-node-id="42:283">Everything you need to know about AccessWeather</p>
      </section>

      <section className="info-section" data-node-id="42:284">
        <div className="section-title-row">
          <img src={iconSparkles} alt="" aria-hidden="true" />
          <h2 data-node-id="42:293">Features</h2>
        </div>
        <div className="feature-grid" data-node-id="42:294">
          {FEATURES.map((feature) => (
            <article className="info-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="info-section" data-node-id="42:325">
        <div className="section-title-row">
          <img src={iconWrench} alt="" aria-hidden="true" />
          <h2 data-node-id="42:330">Troubleshooting</h2>
        </div>
        <div className="info-card accordion" data-node-id="42:331">
          {TROUBLESHOOTING.map((item) => (
            <div className="accordion-item" key={item}>
              <div className="accordion-row">
                <span>{item}</span>
                <img src={iconChevron} alt="" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="info-section" data-node-id="42:356">
        <div className="section-title-row">
          <img src={iconHelp} alt="" aria-hidden="true" />
          <h2 data-node-id="42:363">FAQ</h2>
        </div>
        <div className="info-card accordion" data-node-id="42:364">
          {FAQS.map((item) => (
            <details className="accordion-item" key={item.question}>
              <summary className="accordion-row">
                <span>{item.question}</span>
                <img src={iconChevron} alt="" aria-hidden="true" />
              </summary>
              <p className="accordion-answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="info-section" data-node-id="42:401">
        <div className="section-title-row">
          <img src={iconMailOutline} alt="" aria-hidden="true" />
          <h2 data-node-id="42:407">Contact Support</h2>
        </div>
        <div className="support-grid" data-node-id="42:408">
          <article className="support-card">
            <img src={iconPhone} alt="" aria-hidden="true" />
            <h3>Phone</h3>
            <p>0800 123 4567</p>
            <span>Mon-Fri, 9AM-5PM GMT</span>
          </article>
          <article className="support-card">
            <img src={iconMail} alt="" aria-hidden="true" />
            <h3>Email</h3>
            <p>support@accessweather.com</p>
            <span>Response within 24 hours</span>
          </article>
          <article className="support-card">
            <img src={iconChat} alt="" aria-hidden="true" />
            <h3>Live Chat</h3>
            <p>Available on website</p>
            <span>Mon-Fri, 9AM-5PM GMT</span>
          </article>
        </div>
      </section>

      <section className="info-section" data-node-id="42:437">
        <div className="info-card contact-card">
          <h3>Send us a message</h3>
          <form className="contact-form">
            <label className="input-group">
              <span>Name</span>
              <input type="text" placeholder="Your name" />
            </label>
            <label className="input-group">
              <span>Email</span>
              <input type="email" placeholder="your.email@example.com" />
            </label>
            <label className="input-group">
              <span>Subject</span>
              <input type="text" placeholder="What can we help you with?" />
            </label>
            <label className="input-group">
              <span>Message</span>
              <textarea rows={5} placeholder="Please describe your issue or question." />
            </label>
            <button type="submit" className="cta submit-btn">
              Send Message
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
