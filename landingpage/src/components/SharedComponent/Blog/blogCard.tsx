import React from "react";
import Image from "next/image";
import { Blog } from "@/types/blog";
import { format } from "date-fns";
import Link from "next/link";
import { withBasePath } from "@/utils/urlHelper";

const BlogCard = ({ blog }: { blog: Partial<Blog> }) => {
    const { title, coverImage, date, slug } = blog;

    // Provide defaults for missing properties
    const blogTitle = title || "Untitled";
    const blogImage = coverImage || "/images/placeholder.svg";
    const blogDate = date || new Date().toISOString();
    const blogSlug = slug || "";

    return (
        <>
            <Link href={`/blog/${blogSlug}`} className="group mb-10 flex items-center gap-9">
                <div className="overflow-hidden rounded-lg">
                    <Image
                        src={withBasePath(blogImage)}
                        alt="image"
                        width={300}
                        height={250}
                        className="group-hover:scale-110 duration-300"
                    />
                </div>
                <div className="">
                    <span className="text-16 text-dark_grey mb-1">
                        {format(new Date(blogDate), "MMM dd yyyy")}
                    </span>
                    <h5 className="text-22 font-medium mb-9 group-hover:text-primary">
                        {blogTitle}
                    </h5>
                    <p className="text-primary text-17 font-medium ">
                        Read More
                    </p>
                </div>
            </Link>
        </>
    );
};

export default BlogCard;