# Rebuilding the guide page stylesheet

`index.html` is styled with Tailwind CSS + daisyUI. The browser loads only the compiled file `lib/landing.tailwind.css`
(no internet needed). If you change the classes in `index.html`, rebuild it:

```
mkdir build && cd build
npm init -y
npm i tailwindcss @tailwindcss/cli daisyui
copy ..\input.css input.css
copy ..\..\..\index.html index.html
npx @tailwindcss/cli -i input.css -o ..\..\..\lib\landing.tailwind.css --minify
```

`input.css` also holds the colour theme ("invoicegen").
