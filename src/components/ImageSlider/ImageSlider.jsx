import React, { useState, useEffect } from 'react';
import './ImageSlider.css';

const ImageSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  const slides = [
    {
      image: '/images/icon1.png',
      title: 'Supporting South Lebanon',
      description: 'Help families rebuild their lives after the devastating effects of war'
    },
    {
      image: '/images/icon2.png',
      title: 'Transparent Aid Distribution',
      description: 'Every donation is tracked and verified to ensure maximum impact'
    },
    {
      image: '/images/icon3.png',
      title: 'Community Rebuilding',
      description: 'Working together to restore hope and rebuild communities'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, []);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setProgress(0);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setProgress(0);
  };

  return (
    <section className="image-slider-section">
      <div className="container">
        <div className="section-title">
          <h2>Making a Difference</h2>
          <p className="lead">Join us in supporting families affected by war in South Lebanon</p>
        </div>

        <div className="slider-container">
          <div className="slider-wrapper">
            <div 
              className="slides-container"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div key={index} className="slide">
                  <img 
                    src={slide.image} 
                    alt={slide.title}
                    className="slide-image"
                  />
                  <div className="slide-overlay">
                    <div className="slide-content">
                      <h3 className="slide-title">{slide.title}</h3>
                      <p className="slide-description">{slide.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>



            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="slider-dots" style={{ textAlign: 'center', marginTop: '20px' }}>
            {slides.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              ></button>
            ))}
          </div>
        </div>

        <div className="slider-cta">
          <a href="/register" className="cta-button">
            <i className="fas fa-heart"></i>
            Get Involved Today
          </a>
        </div>
      </div>
    </section>
  );
};

export default ImageSlider;
