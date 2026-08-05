import React from 'react';
import { Link } from 'react-router-dom';

const withBasePath = (url: string) => url;

const Logo: React.FC = () => {
  return (
    <Link to="/">
      <img
        src={withBasePath("/images/logo/logo.svg")}
        alt="logo"
        width={160}
        height={50}
        style={{ width: "auto", height: "auto" }}
      />
    </Link>
  );
};

export default Logo;
