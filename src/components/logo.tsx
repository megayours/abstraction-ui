"use client"
import Image from 'next/image';
import React from 'react';

const Logo = () => {
  return (
    <Image
      src="/images/logo/logo-image6.png"
      alt="MegaYours Logo"
      width={150}
      height={40}
      className="h-8 lg:h-10 w-auto"
    />
  );
};

export default Logo;
