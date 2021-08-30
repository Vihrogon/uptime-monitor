const Link = ReactRouterDOM.Link
const Route = ReactRouterDOM.Route
const Fragment = React.Fragment

function Home() {
  return <div>home</div>
}

function Messages() {
  return <div>messages</div>
}

function About() {
  return <div>about</div>
}
const StyledHeader = styled('header')`
  display: flex;
`
function Header() {
  return (
    <StyledHeader>
      <Link to="/">Home</Link>
      <Link to="/register">Signup</Link>
      <Link to="/login">Login</Link>
      <Link to="/dash">Dashboard</Link>
      <Link to="/account">Account</Link>
      <Link to="/logout">Logout</Link>
    </StyledHeader>
  )
}

function Footer() {
  return <footer>footer footer footer</footer>
}
let reload = () => {
  const current = props.location.pathname
  this.props.history.replace(`/reload`)
  setTimeout(() => {
    this.props.history.replace(current)
  })
}
function App() {
  return (
    <Fragment>
      <Header />
      <main>
        <Route path="/reload" component={null} key="reload" />
        <Route path="/" component={Home} />
        <Route path="/messages" component={Messages} />
        <Route path="/about" component={About} />
      </main>
      <Footer />
    </Fragment>
  )
}

ReactDOM.render(
  <ReactRouterDOM.BrowserRouter>
    <App />
  </ReactRouterDOM.BrowserRouter>,
  document.querySelector('#app')
)
